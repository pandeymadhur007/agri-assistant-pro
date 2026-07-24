import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SarvamSTTOptions {
  language?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'idle' | 'connecting' | 'listening') => void;
  continuous?: boolean;
}

const LANG_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN',
};

// Base64 conversion helper
function encodeBase64(pcmData: Int16Array) {
  const buffer = new Uint8Array(pcmData.buffer);
  let binary = '';
  // Convert in chunks to avoid max call stack limits and improve performance
  for (let i = 0; i < buffer.length; i += 1024) {
    binary += String.fromCharCode.apply(null, buffer.subarray(i, i + 1024) as unknown as number[]);
  }
  return btoa(binary);
}

export function useSarvamSTT({ language = 'en', onTranscript, onError, onStateChange, continuous = false }: SarvamSTTOptions = {}) {
  const [isSupported] = useState(() => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia);
  const [isListening, setIsListening] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // VAD state variables
  const silenceStartRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);

  const isStoppingRef = useRef(false);
  const isActiveRef = useRef(false);
  const targetLangRef = useRef(LANG_MAP[language] || LANG_MAP['en']);

  useEffect(() => {
    targetLangRef.current = LANG_MAP[language] || LANG_MAP['en'];
  }, [language]);

  const cleanupMedia = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(console.error);
      audioCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'flush' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const finishSession = useCallback(() => {
    isStoppingRef.current = true;
    closeWebSocket();
  }, [closeWebSocket]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    setIsListening(false);
    finishSession();
    cleanupMedia();
    onStateChange?.('idle');
  }, [finishSession, cleanupMedia, onStateChange]);

  const establishWebSocket = useCallback(async () => {
      // Prevent duplicate WS instances
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          closeWebSocket();
      }

      const supabaseUrl = supabase.supabaseUrl;
      const wsUrl = supabaseUrl.replace(/^http/, 'ws') + `/functions/v1/sarvam-ws-proxy?language-code=${targetLangRef.current}&model=saaras:v3`;

      const { data: { session } } = await supabase.auth.getSession();
      const authWsUrl = `${wsUrl}&access_token=${session?.access_token || ''}`;

      const ws = new WebSocket(authWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isActiveRef.current || isStoppingRef.current) {
          ws.close();
          return;
        }
        setIsListening(true);
        onStateChange?.('listening');
        // Reset VAD session state
        silenceStartRef.current = null;
        hasSpokenRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);

          if (response.type === 'data' && response.data && response.data.transcript) {
             const transcript = response.data.transcript;
             const isFinal = isStoppingRef.current;

             onTranscript?.(transcript, isFinal);

             if (isFinal) {
               ws.close();
               wsRef.current = null;

               if (!continuous) {
                  stop();
               } else {
                  // In continuous mode, after utterance finishes, we stay active.
                  // We transition UI to idle, and useVoiceAssistant will handle reconnecting logic if needed
                  // Or, we wait here until VAD detects speech again!
                  // Let's rely on VoiceAssistant to re-invoke connect/start when it's ready for the next utterance.
                  setIsListening(false);
                  onStateChange?.('idle');
               }
             }
          } else if (response.type === 'error') {
            onError?.(response.data?.error || 'Unknown Sarvam error');
            ws.close();
            wsRef.current = null;
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        onError?.('websocket-error');
        if (!continuous) stop();
        else {
          setIsListening(false);
          onStateChange?.('idle');
        }
      };
  }, [closeWebSocket, stop, continuous, onError, onStateChange, onTranscript]);

  const connect = useCallback(async () => {
    if (!isSupported) {
      onError?.('not-supported');
      return;
    }

    isActiveRef.current = true;
    isStoppingRef.current = false;
    silenceStartRef.current = null;
    hasSpokenRef.current = false;

    try {
      onStateChange?.('connecting');

      // Initialize media stream ONCE
      if (!streamRef.current) {
         streamRef.current = await navigator.mediaDevices.getUserMedia({
           audio: {
             channelCount: 1,
             sampleRate: 16000,
             echoCancellation: true,
             noiseSuppression: true,
           }
         });
      }

      if (!isActiveRef.current) return;

      const stream = streamRef.current;

      // Initialize audio context ONCE
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
         audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });

         const source = audioCtxRef.current.createMediaStreamSource(stream);
         sourceRef.current = source;

         const analyser = audioCtxRef.current.createAnalyser();
         analyser.fftSize = 1024;
         source.connect(analyser);
         analyserRef.current = analyser;

         const processor = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
         processorRef.current = processor;

         source.connect(processor);
         processor.connect(audioCtxRef.current.destination);

         const dataArray = new Uint8Array(analyser.fftSize);

         // Process audio and perform VAD in the Web Audio thread
         processor.onaudioprocess = (e) => {
            if (!isActiveRef.current) return;

            // 1. Perform VAD (Silence Detection)
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i] - 128) / 128.0;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);

            // If we are currently "speaking" (playing TTS), the continuous loop should be active
            // but we might not have a WebSocket open. If we detect loud speech, we need to handle barge-in.
            // Barge-in logic: if rms > 0.05 and no WS is open, we should open it!
            if (rms > 0.05) {
               hasSpokenRef.current = true;
               silenceStartRef.current = null;

               // Barge-in: if we have no active WS, but we are supposed to be active, re-establish WS
               if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
                   if (!isStoppingRef.current) {
                      establishWebSocket();
                   }
               }
            } else if (hasSpokenRef.current && rms < 0.01) {
               if (silenceStartRef.current === null) {
                  silenceStartRef.current = performance.now();
               } else if (performance.now() - silenceStartRef.current > 1500) {
                  // End of utterance detected
                  if (!isStoppingRef.current) {
                     finishSession();
                  }
               }
            } else {
               silenceStartRef.current = null;
            }

            // 2. Transmit audio if WS is open
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isStoppingRef.current) {
              const inputData = e.inputBuffer.getChannelData(0);
              const outputData = e.outputBuffer.getChannelData(0);

              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                outputData[i] = 0; // prevent echo
              }

              const base64 = encodeBase64(pcmData);

              wsRef.current.send(JSON.stringify({
                audio: {
                  data: base64,
                  sample_rate: "16000",
                  encoding: "audio/wav"
                }
              }));
            }
          };
      }

      // Initial WS connection
      await establishWebSocket();

    } catch (err: unknown) {
      console.error('Error starting Sarvam STT', err);
      onError?.((err as Error).message || 'permission-denied');
      stop();
    }
  }, [isSupported, establishWebSocket, onError, onStateChange, finishSession, stop]);

  const start = useCallback(() => {
     connect();
  }, [connect]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { isListening, isSupported, start, stop };
}
