import { useState, useCallback, useEffect } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string, lang: string = 'en-IN') => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher for natural Indian accent
    
    // Wait for voices to load and find best Indian English voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer Indian English voices (Google's are best quality)
      const indianVoice = voices.find(v => 
        v.lang === 'en-IN' && v.name.includes('Google')
      ) || voices.find(v => 
        v.lang === 'en-IN'
      ) || voices.find(v => 
        v.lang.startsWith('en') && v.name.toLowerCase().includes('india')
      ) || voices.find(v => 
        v.lang.startsWith('en')
      );
      
      if (indianVoice) {
        utterance.voice = indianVoice;
      }
    };
    
    // Voices may not be loaded yet
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
  };
}
