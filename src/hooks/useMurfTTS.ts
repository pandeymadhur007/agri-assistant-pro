import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      if (error) {
        console.error('Murf TTS error:', error);
        toast({
          title: 'Voice Error',
          description: 'Could not generate speech. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!data?.audio) {
        console.error('No audio data received');
        setIsLoading(false);
        return;
      }

      // Convert base64 to audio blob and play
      const audioBlob = base64ToBlob(data.audio, 'audio/mpeg');
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
      toast({
        title: 'Voice Error',
        description: 'Could not play audio. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
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
