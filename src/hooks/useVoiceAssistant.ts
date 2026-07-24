import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN',
};

interface Opts {
  language?: string;
  isThinking: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  onTranscript: (text: string) => void;
}

/**
 * ChatGPT-style continuous voice assistant.
 * - Tap once → mic stays on until the user taps Stop
 * - Continuous recognition auto-restarts on unexpected `onend`
 * - Silence detection commits the utterance and sends it upstream
 * - Recognition is paused while thinking/speaking, resumed automatically after TTS
 * - Barge-in: speaking again interrupts TTS immediately
 */
export function useVoiceAssistant({
  language = 'en',
  isThinking,
  isSpeaking,
  stopSpeaking,
  onTranscript,
}: Opts) {
  const SR = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;
  const isSupported = !!SR;

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  // "enabled" = user intent to be in voice-mode. Persists across restarts, pauses.
  const enabledRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const startingRef = useRef(false);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const silenceTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  isSpeakingRef.current = isSpeaking;
  isThinkingRef.current = isThinking;

  const clearSilence = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };
  const clearRestart = () => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const commit = useCallback(() => {
    clearSilence();
    const text = (finalRef.current || interimRef.current).trim();
    finalRef.current = '';
    interimRef.current = '';
    setInterim('');
    if (text) {
      // Pause recognition while the assistant thinks/speaks
      const rec = recRef.current;
      if (rec) { try { rec.stop(); } catch { /* noop */ } }
      onTranscript(text);
    }
  }, [onTranscript]);

  const startRecognition = useCallback(() => {
    if (!SR) { setError('unsupported'); return; }
    if (startingRef.current) return;
    if (recRef.current) return; // already running
    if (isThinkingRef.current || isSpeakingRef.current) return;
    startingRef.current = true;

    try {
      const rec = new SR();
      rec.lang = LANG_MAP[language] || 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      finalRef.current = '';
      interimRef.current = '';
      setInterim('');

      rec.onstart = () => {
        setListening(true);
        setError(null);
      };

      rec.onaudiostart = () => { /* mic hot */ };
      rec.onaudioend = () => { /* mic cool */ };

      rec.onresult = (e: any) => {
        let interimText = '';
        let finalText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        // Barge-in
        if ((interimText || finalText) && isSpeakingRef.current) {
          stopSpeaking();
        }
        if (finalText) finalRef.current += finalText;
        interimRef.current = interimText;
        setInterim((finalRef.current + ' ' + interimText).trim());

        // Reset silence timer on every new chunk
        clearSilence();
        silenceTimerRef.current = window.setTimeout(() => {
          commit();
        }, 1400);
      };

      rec.onspeechend = () => {
        // Some browsers fire this reliably; commit shortly after
        clearSilence();
        silenceTimerRef.current = window.setTimeout(() => commit(), 600);
      };

      rec.onerror = (e: any) => {
        const err = e?.error || 'error';
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setError('permission-denied');
          enabledRef.current = false;
          setEnabled(false);
        } else if (err !== 'no-speech' && err !== 'aborted') {
          setError(err);
        }
      };

      rec.onend = () => {
        setListening(false);
        recRef.current = null;
        clearSilence();
        // Flush any pending final text if we ended without a silence commit
        const pending = (finalRef.current || interimRef.current).trim();
        if (pending && !isThinkingRef.current && !isSpeakingRef.current) {
          finalRef.current = '';
          interimRef.current = '';
          setInterim('');
          onTranscript(pending);
          return; // wait for think/speak cycle to auto-resume
        }
        // Auto-restart if voice mode is still enabled and we're idle
        if (enabledRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
          clearRestart();
          restartTimerRef.current = window.setTimeout(() => startRecognition(), 250);
        }
      };

      recRef.current = rec;
      rec.start();
    } catch (e: any) {
      // "already started" — swallow, session exists
      const msg = e?.message || '';
      if (!/already started/i.test(msg)) setError(msg || 'start_failed');
      recRef.current = null;
    } finally {
      startingRef.current = false;
    }
  }, [SR, language, stopSpeaking, commit, onTranscript]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    clearRestart();
    clearSilence();
    const rec = recRef.current;
    if (rec) {
      try { rec.onend = null; rec.abort(); } catch { /* noop */ }
    }
    recRef.current = null;
    setListening(false);
    setInterim('');
    finalRef.current = '';
    interimRef.current = '';
  }, []);

  const start = useCallback(async () => {
    if (!SR) { setError('unsupported'); return; }
    // Proactively ask for mic permission so the first tap works reliably
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setError('permission-denied');
      return;
    }
    enabledRef.current = true;
    setEnabled(true);
    startRecognition();
  }, [SR, startRecognition]);

  const toggle = useCallback(() => {
    if (enabledRef.current) stop();
    else start();
  }, [start, stop]);

  // Auto-resume listening after the assistant finishes thinking + speaking
  useEffect(() => {
    if (!enabled) return;
    if (isThinking || isSpeaking) return;
    if (recRef.current) return;
    clearRestart();
    restartTimerRef.current = window.setTimeout(() => startRecognition(), 250);
    return () => clearRestart();
  }, [enabled, isThinking, isSpeaking, startRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      enabledRef.current = false;
      clearSilence();
      clearRestart();
      const rec = recRef.current;
      if (rec) {
        try {
          rec.onresult = null; rec.onend = null; rec.onerror = null;
          rec.onstart = null; rec.onspeechend = null;
          rec.onaudiostart = null; rec.onaudioend = null;
          rec.abort();
        } catch { /* noop */ }
      }
      recRef.current = null;
    };
  }, []);

  const state: VoiceState =
    isThinking ? 'thinking' :
    isSpeaking ? 'speaking' :
    (listening || enabled) ? 'listening' :
    'idle';

  return { state, listening, enabled, interim, error, isSupported, start, stop, toggle };
}