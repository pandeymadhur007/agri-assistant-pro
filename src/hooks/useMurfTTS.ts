import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Browser SpeechSynthesis fallback used when the cloud TTS service fails
// (e.g. unsupported voice, rate limits, network issues).
const BROWSER_LANG_MAP: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN',
};

function speakWithBrowser(text: string, language: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = BROWSER_LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.95;
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
  const { toast } = useToast();

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string, language: string = 'en') => {
    if (!text.trim()) return;

    // Stop any current playback
    stop();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('murf-tts', {
        body: { text, language },
      });

      // Cloud TTS failed → silently fall back to browser SpeechSynthesis
      if (error || data?.fallback || !data?.audio) {
        if (error) console.warn('Murf TTS unavailable, falling back to browser TTS');
        setIsLoading(false);
        const ok = speakWithBrowser(text, language);
        if (ok) {
          setIsPlaying(true);
          // Approximate "ended" — browser speechSynthesis doesn't always fire reliably
          const u = (window.speechSynthesis as any);
          const checkDone = setInterval(() => {
            if (!u?.speaking) { setIsPlaying(false); clearInterval(checkDone); }
          }, 300);
        }
        return;
      }

      // Convert base64 to audio blob and play (Sarvam returns WAV, Murf returned MP3)
      const mimeType = data.mime || 'audio/mpeg';
      const audioBlob = base64ToBlob(data.audio, mimeType);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setIsLoading(false);
      // Last-resort fallback
      const ok = speakWithBrowser(text, language);
      if (!ok) {
        toast({
          title: 'Voice Error',
          description: 'Could not play audio. Please try again.',
          variant: 'destructive',
        });
      }
    }
  }, [stop, toast]);

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
