import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceMode = 'push-to-talk' | 'hands-free';

const STORAGE_KEY = 'gram-ai-voice-mode';

export function useVoiceMode() {
  const [mode, setModeState] = useState<VoiceMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as VoiceMode) || 'push-to-talk';
  });

  const setMode = useCallback((m: VoiceMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'push-to-talk' ? 'hands-free' : 'push-to-talk');
  }, [mode, setMode]);

  return { mode, setMode, toggle, isHandsFree: mode === 'hands-free' };
}

/**
 * Detects ~`silenceMs` of silence on the user's mic and fires `onSilence`.
 * Used by hands-free mode to auto-stop the recording.
 */
export function useSilenceDetector(
  enabled: boolean,
  silenceMs: number,
  onSilence: () => void
) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          const isSilent = rms < 0.02;
          const now = performance.now();
          if (isSilent) {
            if (silenceStartRef.current == null) silenceStartRef.current = now;
            else if (now - silenceStartRef.current > silenceMs) {
              onSilence();
              silenceStartRef.current = null;
              return;
            }
          } else {
            silenceStartRef.current = null;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.warn('Silence detector failed:', e);
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, silenceMs]);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    silenceStartRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }
}
