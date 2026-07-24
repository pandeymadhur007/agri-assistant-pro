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
  autoListenAfterSpeak?: boolean;
}

/**
 * ChatGPT-style continuous voice assistant.
 * - Tap once to start listening
 * - Auto-stops on silence (native SR behavior with continuous=false)
 * - Sends transcript upstream, waits while thinking, resumes after TTS
 * - Interrupts TTS the moment new speech is detected
 */
export function useVoiceAssistant({
  language = 'en',
  isThinking,
  isSpeaking,
  stopSpeaking,
  onTranscript,
  autoListenAfterSpeak = true,
}: Opts) {
  const SR = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;
  const isSupported = !!SR;

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const startingRef = useRef(false);
  const finalRef = useRef('');
  const interimRef = useRef('');
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (rec) {
      try { rec.stop(); } catch { /* noop */ }
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    if (!SR) { setError('unsupported'); return; }
    if (startingRef.current || listening) return;
    startingRef.current = true;
    setError(null);

    try {
      // Prevent recognition sessions overlapping — force-close any prior instance
      if (recRef.current) {
        try { recRef.current.abort(); } catch { /* noop */ }
        recRef.current = null;
      }

      const rec = new SR();
      rec.lang = LANG_MAP[language] || 'en-IN';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      finalRef.current = '';
      interimRef.current = '';
      setInterim('');

      rec.onresult = (e: any) => {
        let interimText = '';
        let finalText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        // Barge-in: cancel any AI speech the moment the user starts speaking
        if ((interimText || finalText) && isSpeakingRef.current) {
          stopSpeaking();
        }
        if (finalText) finalRef.current += finalText;
        interimRef.current = interimText;
        setInterim(interimText);
      };

      rec.onerror = (e: any) => {
        const err = e?.error || 'error';
        // "no-speech" / "aborted" are benign — treat as normal stop
        if (err !== 'no-speech' && err !== 'aborted') setError(err);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
        const text = (finalRef.current || interimRef.current).trim();
        finalRef.current = '';
        interimRef.current = '';
        setInterim('');
        recRef.current = null;
        if (text) onTranscript(text);
      };

      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch (e: any) {
      setError(e?.message || 'start_failed');
      setListening(false);
    } finally {
      startingRef.current = false;
    }
  }, [SR, language, listening, onTranscript, stopSpeaking]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Auto-return to listening after the assistant finishes speaking
  const prevSpeakingRef = useRef(false);
  useEffect(() => {
    if (prevSpeakingRef.current && !isSpeaking && autoListenAfterSpeak && !isThinking) {
      const t = setTimeout(() => { start(); }, 300);
      prevSpeakingRef.current = isSpeaking;
      return () => clearTimeout(t);
    }
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, isThinking, autoListenAfterSpeak, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const rec = recRef.current;
      if (rec) {
        try { rec.onresult = null; rec.onend = null; rec.onerror = null; rec.abort(); } catch { /* noop */ }
      }
      recRef.current = null;
    };
  }, []);

  const state: VoiceState = isThinking ? 'thinking' : isSpeaking ? 'speaking' : listening ? 'listening' : 'idle';

  return { state, listening, interim, error, isSupported, start, stop, toggle };
}