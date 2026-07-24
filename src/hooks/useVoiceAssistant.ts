import { useCallback, useState, useEffect, useRef } from 'react';
import { useSarvamSTT } from './useSarvamSTT';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking';

interface Opts {
  language?: string;
  isThinking: boolean;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  onTranscript: (text: string) => void;
}

export function useVoiceAssistant({
  language = 'en',
  isThinking,
  isSpeaking,
  stopSpeaking,
  onTranscript,
}: Opts) {
  const [internalState, setInternalState] = useState<'idle' | 'listening'>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => {
     isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const handleStateChange = useCallback((newState: 'idle' | 'connecting' | 'listening') => {
    if (newState === 'connecting') {
       setInternalState('listening');
    } else {
       setInternalState(newState);
    }
  }, []);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setInterim(text);

    // If we received text, and TTS is playing, barge-in!
    if (text.trim() && isSpeakingRef.current) {
        stopSpeaking();
    }

    if (isFinal && text.trim()) {
      onTranscript(text.trim());
      setTimeout(() => setInterim(''), 1000);
    }
  }, [onTranscript, stopSpeaking]);

  const handleError = useCallback((err: string) => {
    setError(err);
    setInternalState('idle');
  }, []);

  const { isSupported, start: startSTT, stop: stopSTT } = useSarvamSTT({
    language,
    onStateChange: handleStateChange,
    onTranscript: handleTranscript,
    onError: handleError,
    continuous: enabled
  });

  const stopContinuous = useCallback(() => {
    setEnabled(false);
    stopSTT();
    setInterim('');
  }, [stopSTT]);

  const startContinuous = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setEnabled(true);
    setError(null);
    setInterim('');
    startSTT();
  }, [isSpeaking, stopSpeaking, startSTT]);

  const toggleContinuous = useCallback(() => {
    if (enabled) {
      stopContinuous();
    } else {
      startContinuous();
    }
  }, [enabled, startContinuous, stopContinuous]);

  // Derived state machine
  const state: VoiceState =
    isThinking ? 'thinking' :
    isSpeaking ? 'speaking' :
    internalState;

  return { state, listening: internalState === 'listening', enabled, interim, error, isSupported, start: startContinuous, stop: stopContinuous, toggle: toggleContinuous };
}
