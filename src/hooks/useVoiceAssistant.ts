import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Opts {
  language?: string;
  isThinking: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  onTranscript: (text: string) => void;
}

// Silence detection tuning
const SILENCE_RMS = 0.012;         // below this = "quiet"
const SPEECH_RMS = 0.03;           // above this = "user is speaking"
const SILENCE_MS = 1400;           // silence before we cut the utterance
const MAX_UTTERANCE_MS = 15000;    // hard cap per utterance
const MIN_UTTERANCE_MS = 400;      // ignore accidental taps / clicks

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',            // iOS Safari
    'audio/mp4;codecs=mp4a.40.2',
    'audio/ogg;codecs=opus',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = reader.result as string;
      // strip "data:*/*;base64,"
      resolve(s.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * ChatGPT-style continuous voice assistant powered by cloud STT.
 * - Tap once → mic stays on until the user taps Stop
 * - MediaRecorder captures each utterance; Web Audio RMS detects silence
 * - On silence: audio → speech-to-text edge function → onTranscript()
 * - Recording pauses while thinking/speaking, auto-resumes after TTS
 * - Barge-in: talking while TTS plays cancels it immediately
 * - Works in every modern browser (Safari, Firefox, Chrome, Brave) + Capacitor
 */
export function useVoiceAssistant({
  language = 'en',
  isThinking,
  isSpeaking,
  stopSpeaking,
  onTranscript,
}: Opts) {
  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    typeof (window as any).MediaRecorder !== 'undefined';

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const speechDetectedRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const utteranceStartRef = useRef(0);
  const stoppingRef = useRef(false);

  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  isSpeakingRef.current = isSpeaking;
  isThinkingRef.current = isThinking;

  const cleanupStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try { analyserRef.current?.disconnect(); } catch { /* noop */ }
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    try {
      const base64 = await blobToBase64(blob);
      const { data, error: fnError } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64, language, mimeType: mimeTypeRef.current },
      });
      if (fnError) {
        console.error('STT invoke error:', fnError);
        setError('transcription-failed');
        return;
      }
      const text = (data?.transcript || '').trim();
      if (text) {
        setInterim('');
        onTranscript(text);
      }
    } catch (e) {
      console.error('STT exception:', e);
      setError('transcription-failed');
    }
  }, [language, onTranscript]);

  const stopRecorderAndSend = useCallback(() => {
    if (stoppingRef.current) return;
    const rec = recorderRef.current;
    if (!rec || rec.state === 'inactive') return;
    stoppingRef.current = true;
    try { rec.stop(); } catch { /* noop */ }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) { setError('unsupported'); return; }
    if (recorderRef.current) return;
    if (isThinkingRef.current || isSpeakingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType || 'audio/webm';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      stoppingRef.current = false;
      speechDetectedRef.current = false;
      utteranceStartRef.current = performance.now();
      lastSpeechAtRef.current = performance.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const chunks = chunksRef.current;
        const duration = performance.now() - utteranceStartRef.current;
        cleanupStream();
        setListening(false);
        stoppingRef.current = false;
        // Only send if the user actually said something
        if (speechDetectedRef.current && duration >= MIN_UTTERANCE_MS && chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeTypeRef.current });
          setInterim('Transcribing…');
          transcribe(blob);
        } else {
          setInterim('');
          // No speech captured — resume listening if still enabled
          if (enabledRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
            window.setTimeout(() => { void startRecording(); }, 200);
          }
        }
      };
      recorder.onerror = (e: any) => {
        console.error('Recorder error:', e?.error || e);
        setError('recorder-error');
      };

      // Web Audio silence detection
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      const buffer = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (!analyserRef.current || !recorderRef.current) return;
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);
        const now = performance.now();

        if (rms > SPEECH_RMS) {
          if (!speechDetectedRef.current) {
            speechDetectedRef.current = true;
            setInterim('Listening…');
          }
          lastSpeechAtRef.current = now;
          // Barge-in: user talks while TTS is playing
          if (isSpeakingRef.current) stopSpeaking();
        } else if (rms < SILENCE_RMS) {
          const sinceSpeech = now - lastSpeechAtRef.current;
          if (speechDetectedRef.current && sinceSpeech > SILENCE_MS) {
            stopRecorderAndSend();
            return;
          }
        }

        // Hard cap
        if (now - utteranceStartRef.current > MAX_UTTERANCE_MS) {
          stopRecorderAndSend();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      recorder.start(200);
      setListening(true);
      setError(null);
      setInterim('Listening…');
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      console.error('Failed to start recording:', e);
      const name = e?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('permission-denied');
      } else if (name === 'NotFoundError') {
        setError('no-microphone');
      } else {
        setError('start-failed');
      }
      enabledRef.current = false;
      setEnabled(false);
      cleanupStream();
      setListening(false);
    }
  }, [isSupported, stopSpeaking, transcribe, cleanupStream, stopRecorderAndSend]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    setInterim('');
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      // We're stopping voice mode entirely: discard whatever was being recorded.
      speechDetectedRef.current = false;
      try { rec.stop(); } catch { /* noop */ }
    } else {
      cleanupStream();
      setListening(false);
    }
  }, [cleanupStream]);

  const start = useCallback(async () => {
    if (!isSupported) { setError('unsupported'); return; }
    setError(null);
    enabledRef.current = true;
    setEnabled(true);
    await startRecording();
  }, [isSupported, startRecording]);

  const toggle = useCallback(() => {
    if (enabledRef.current) stop();
    else void start();
  }, [start, stop]);

  // Auto-resume listening after the assistant finishes thinking + speaking
  useEffect(() => {
    if (!enabled) return;
    if (isThinking || isSpeaking) return;
    if (recorderRef.current) return;
    const id = window.setTimeout(() => { void startRecording(); }, 250);
    return () => window.clearTimeout(id);
  }, [enabled, isThinking, isSpeaking, startRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enabledRef.current = false;
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') {
        speechDetectedRef.current = false;
        try { rec.stop(); } catch { /* noop */ }
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  const state: VoiceState =
    isThinking ? 'thinking' :
    isSpeaking ? 'speaking' :
    (listening || enabled) ? 'listening' :
    'idle';

  return { state, listening, enabled, interim, error, isSupported, start, stop, toggle };
}