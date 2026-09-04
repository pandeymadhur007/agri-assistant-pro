import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Opts {
  language?: string;
  isThinking: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  onTranscript: (text: string) => void;
  /** Push-to-talk: one utterance per press, no auto-resume loop. */
  pushToTalk?: boolean;
}

export type MicPermission = 'unknown' | 'granted' | 'denied' | 'prompt';


// Silence detection tuning for farm/noisy mobile environments.
const SILENCE_RMS = 0.004;
const SPEECH_RMS = 0.009;
const SPEECH_PEAK = 0.035;
const SILENCE_MS = 700;
const MAX_UTTERANCE_MS = 7000;
const MIN_UTTERANCE_MS = 600;
const TARGET_SAMPLE_RATE = 16000;
// 16 kHz * 2 bytes * 0.6 s + 44-byte header — anything shorter is rejected by the STT model.
const MIN_WAV_BYTES = 44 + Math.round(TARGET_SAMPLE_RATE * 2 * 0.6);
const BACKOFF_MS = 6000;

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

function downsampleBuffer(input: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
  if (outputSampleRate === inputSampleRate) return input;
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  let inputOffset = 0;

  for (let i = 0; i < outputLength; i++) {
    const nextInputOffset = Math.round((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = inputOffset; j < nextInputOffset && j < input.length; j++) {
      sum += input[j];
      count++;
    }
    output[i] = count > 0 ? sum / count : 0;
    inputOffset = nextInputOffset;
  }

  return output;
}

function encodeWav(chunks: Float32Array[], inputSampleRate: number): Blob {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const samples = downsampleBuffer(merged, inputSampleRate, TARGET_SAMPLE_RATE);
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (pos: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(pos + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let wavOffset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(wavOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    wavOffset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * ChatGPT-style continuous voice assistant powered by cloud STT.
 * - Tap once → mic stays on until the user taps Stop
 * - Web Audio captures clean PCM and encodes each utterance as WAV
 * - On silence: audio → speech-to-text edge function → onTranscript()
 * - Recording pauses while thinking/speaking, auto-resumes after TTS
 * - Barge-in: talking while TTS plays cancels it immediately
 * - Works in every modern browser with microphone + Web Audio support
 */
export function useVoiceAssistant({
  language = 'en',
  isThinking,
  isSpeaking,
  stopSpeaking,
  onTranscript,
  pushToTalk = false,
}: Opts) {
  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    !!((window as any).AudioContext || (window as any).webkitAudioContext);

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<MicPermission>('unknown');
  const enabledRef = useRef(false);
  const pushToTalkRef = useRef(pushToTalk);
  pushToTalkRef.current = pushToTalk;

  // Track the browser-level mic permission so the UI can explain a hard denial.
  useEffect(() => {
    let cancelled = false;
    const perms = (navigator as any)?.permissions;
    if (!perms?.query) return;
    let status: any;
    perms
      .query({ name: 'microphone' as PermissionName })
      .then((s: any) => {
        if (cancelled) return;
        status = s;
        setPermission(s.state as MicPermission);
        s.onchange = () => setPermission(s.state as MicPermission);
      })
      .catch(() => {/* Safari/Firefox may not expose the microphone permission */});
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, []);



  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(TARGET_SAMPLE_RATE);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const speechDetectedRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const utteranceStartRef = useRef(0);
  const stoppingRef = useRef(false);
  const transcribingRef = useRef(false);
  // Timestamp before which we must not call the STT function again (rate-limit backoff).
  const cooldownUntilRef = useRef(0);

  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  isSpeakingRef.current = isSpeaking;
  isThinkingRef.current = isThinking;

  const cleanupStream = useCallback(() => {
    try { processorRef.current?.disconnect(); } catch { /* noop */ }
    try { sourceRef.current?.disconnect(); } catch { /* noop */ }
    try { silentGainRef.current?.disconnect(); } catch { /* noop */ }
    processorRef.current = null;
    sourceRef.current = null;
    silentGainRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    pcmChunksRef.current = [];
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    if (transcribingRef.current) return;
    transcribingRef.current = true;
    setTranscribing(true);
    try {
      if (blob.size < MIN_WAV_BYTES) {
        setInterim('');
        return;
      }
      if (Date.now() < cooldownUntilRef.current) {
        setInterim('Voice service is busy. Retrying shortly…');
        return;
      }
      const base64 = await blobToBase64(blob);
      const invokePromise = supabase.functions.invoke('speech-to-text', {
        body: { audio: base64, language, mimeType: 'audio/wav' },
      });
      let timeoutId = 0;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Transcription timed out')), 30000);
      });
      const { data, error: fnError } = await Promise.race([invokePromise, timeoutPromise]);
      window.clearTimeout(timeoutId);
      if (fnError) {
        console.error('STT invoke error:', fnError);
        const msg = String(fnError.message || '');
        if (msg.includes('429') || /rate limit/i.test(msg)) {
          cooldownUntilRef.current = Date.now() + BACKOFF_MS;
          setError('rate-limited');
          setInterim('Voice service is busy. Please wait a few seconds.');
          return;
        }
        // Bad audio: back off briefly so we don't loop on the same failure.
        cooldownUntilRef.current = Date.now() + 1500;
        setError('transcription-failed');
        setInterim('Could not understand. Tap mic and try again.');
        return;
      }
      const text = (data?.transcript || '').trim();
      if (text) {
        setInterim('');
        onTranscript(text);
      } else {
        setInterim('I did not catch that. Please speak again.');
      }
    } catch (e) {
      console.error('STT exception:', e);
      setError('transcription-failed');
      setInterim('Voice took too long. Please try again.');
    } finally {
      transcribingRef.current = false;
      setTranscribing(false);
      if (pushToTalkRef.current) {
        enabledRef.current = false;
        setEnabled(false);
      }
    }
  }, [language, onTranscript]);


  const stopRecorderAndSend = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    const chunks = pcmChunksRef.current.slice();
    const duration = performance.now() - utteranceStartRef.current;
    const shouldSend = speechDetectedRef.current && duration >= MIN_UTTERANCE_MS && chunks.length > 0;
    const sampleRate = sampleRateRef.current;
    cleanupStream();
    setListening(false);
    stoppingRef.current = false;

    if (shouldSend) {
      const wavBlob = encodeWav(chunks, sampleRate);
      setInterim('Transcribing…');
      void transcribe(wavBlob);
    } else {
      setInterim('');
      if (pushToTalkRef.current) {
        enabledRef.current = false;
        setEnabled(false);
      } else if (enabledRef.current && !transcribingRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
        window.setTimeout(() => { void startRecordingRef.current?.(); }, 150);
      }
    }

  }, [cleanupStream, transcribe]);

  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const startRecording = useCallback(async () => {
    if (!isSupported) { setError('unsupported'); return; }
    if (audioCtxRef.current || processorRef.current) return;
    if (transcribingRef.current || isThinkingRef.current || isSpeakingRef.current) return;

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

      pcmChunksRef.current = [];
      stoppingRef.current = false;
      speechDetectedRef.current = false;
      utteranceStartRef.current = performance.now();
      lastSpeechAtRef.current = performance.now();

      // Web Audio silence detection
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate || TARGET_SAMPLE_RATE;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      silentGainRef.current = silentGain;

      processor.onaudioprocess = (event) => {
        if (stoppingRef.current || !enabledRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const frame = new Float32Array(input);
        pcmChunksRef.current.push(frame);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < frame.length; i++) {
          const amplitude = Math.abs(frame[i]);
          sum += frame[i] * frame[i];
          if (amplitude > peak) peak = amplitude;
        }
        const rms = Math.sqrt(sum / frame.length);
        const now = performance.now();

        if (rms > SPEECH_RMS || peak > SPEECH_PEAK) {
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
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
      setListening(true);
      setError(null);
      setInterim('Listening… speak now');
    } catch (e: any) {
      console.error('Failed to start recording:', e);
      const name = e?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('permission-denied');
        setPermission('denied');
        setInterim('Microphone access is blocked. Allow it, then tap Retry.');
      } else if (name === 'NotFoundError') {
        setError('no-microphone');
        setInterim('No microphone was found on this device.');
      } else {
        setError('start-failed');
        setInterim('Microphone could not start. Please try again.');
      }
      enabledRef.current = false;
      setEnabled(false);
      cleanupStream();
      setListening(false);

    }
  }, [isSupported, stopSpeaking, cleanupStream, stopRecorderAndSend]);

  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const stop = useCallback(() => {
    const hasCapturedSpeech = speechDetectedRef.current && pcmChunksRef.current.length > 0;
    enabledRef.current = false;
    setEnabled(false);
    setInterim('');
    if (hasCapturedSpeech && (audioCtxRef.current || processorRef.current)) {
      stopRecorderAndSend();
      return;
    }
    speechDetectedRef.current = false;
    cleanupStream();
    setListening(false);
  }, [cleanupStream, stopRecorderAndSend]);

  /** Abort the current utterance and throw the audio away (hold-to-cancel). */
  const cancel = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    stoppingRef.current = true;
    speechDetectedRef.current = false;
    pcmChunksRef.current = [];
    cleanupStream();
    stoppingRef.current = false;
    setListening(false);
    setInterim('');
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

  /** Explicit user retry after a permission / start failure. */
  const retry = useCallback(async () => {
    setError(null);
    setInterim('');
    await start();
  }, [start]);

  // Auto-resume listening after the assistant finishes thinking + speaking
  useEffect(() => {
    if (pushToTalk) return;
    if (!enabled) return;
    if (transcribing || isThinking || isSpeaking) return;
    if (audioCtxRef.current || processorRef.current) return;
    const wait = Math.max(250, cooldownUntilRef.current - Date.now());
    const id = window.setTimeout(() => { void startRecording(); }, wait);
    return () => window.clearTimeout(id);
  }, [pushToTalk, enabled, transcribing, isThinking, isSpeaking, startRecording]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enabledRef.current = false;
      speechDetectedRef.current = false;
      cleanupStream();
    };
  }, [cleanupStream]);

  const state: VoiceState =
    (isThinking || transcribing) ? 'thinking' :
    isSpeaking ? 'speaking' :
    (listening || enabled) ? 'listening' :
    'idle';

  return { state, listening, enabled, interim, error, isSupported, start, stop, toggle };
}