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
 * Detects ~`silenceMs` of silence on a provided MediaStream and fires `onSilence`.
 * Reuses the recording stream (no extra getUserMedia call) to keep things lag-free.
 */
export function useSilenceDetector(
  enabled: boolean,
  silenceMs: number,
  onSilence: () => void,
  stream: MediaStream | null
) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const onSilenceRef = useRef(onSilence);
  onSilenceRef.current = onSilence;

  useEffect(() => {
    if (!enabled || !stream) {
      cleanup();
      return;
    }

    let cancelled = false;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const startedAt = performance.now();

      const tick = () => {
        if (cancelled) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const isSilent = rms < 0.018;
        const now = performance.now();
        // Grace period so we don't auto-stop before the user even speaks
        const grace = now - startedAt < 800;
        if (isSilent && !grace) {
          if (silenceStartRef.current == null) silenceStartRef.current = now;
          else if (now - silenceStartRef.current > silenceMs) {
            onSilenceRef.current();
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

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, silenceMs, stream]);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    silenceStartRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }
}
