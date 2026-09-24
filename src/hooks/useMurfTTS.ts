import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Browser SpeechSynthesis fallback used when the cloud TTS service fails
// (e.g. unsupported voice, rate limits, network issues).
const BROWSER_LANG_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN',
};

function speakWithBrowser(text: string, language: string, onDone: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BROWSER_LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = onDone;
    utterance.onerror = onDone;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function useMurfTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const { toast } = useToast();

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string, language: string = 'en') => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();
    const requestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('murf-tts', {
        body: { text, language },
      });
      if (requestId !== requestIdRef.current) return;

      // Cloud TTS failed → fall back to browser SpeechSynthesis
      if (error || data?.fallback || !data?.audio) {
        if (error) console.warn('Murf TTS unavailable, falling back to browser TTS');
        setIsLoading(false);
        const ok = speakWithBrowser(text, language, () => {
          if (requestId === requestIdRef.current) setIsPlaying(false);
        });
        if (ok && requestId === requestIdRef.current) setIsPlaying(true);
        return;
      }

      // Convert base64 to audio blob and play (Sarvam returns WAV, Murf returned MP3)
      const mimeType = data.mime || 'audio/mpeg';
      const audioBlob = base64ToBlob(data.audio, mimeType);
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        if (requestId !== requestIdRef.current) return;
        setIsPlaying(false);
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      audio.onerror = () => {
        if (requestId !== requestIdRef.current) return;
        console.error('Audio playback error');
        setIsPlaying(false);
        setIsLoading(false);
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      await audio.play();

    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('TTS error:', err);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setIsLoading(false);
      // Last-resort fallback
      const ok = speakWithBrowser(text, language, () => {
        if (requestId === requestIdRef.current) setIsPlaying(false);
      });
      if (ok) setIsPlaying(true);
      else {
        toast({
          title: 'Voice Error',
          description: 'Could not play audio. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [stop, toast]);

  useEffect(() => () => stop(), [stop]);

  return {
    isPlaying,
    isLoading,
    isSupported: true, // Always supported since it's cloud-based
    speak,
    stop,
  };
}

// Helper to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
