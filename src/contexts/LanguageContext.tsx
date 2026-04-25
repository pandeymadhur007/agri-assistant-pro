import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Language, t as translate } from '@/lib/i18n';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gram-ai-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gram-ai-language', lang);
  }, []);

  const t = useCallback((key: string) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Re-export hook from its own module to keep Fast Refresh happy
export { useLanguage } from './useLanguage';
