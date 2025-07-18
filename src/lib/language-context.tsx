"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  translate: (text: string, sourceLang?: string) => Promise<string>;
  availableLanguages: { code: string; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
  languages?: { code: string; name: string }[];
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
  languages = [
    { code: 'en', name: 'English' },
    { code: 'sv', name: 'Swedish' },
    { code: 'fi', name: 'Finnish' },
  ],
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);

  // Update currentLanguage from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('appLanguage');
      if (storedLang) {
        setCurrentLanguage(storedLang);
      }
    }
  }, []);
  const [translationsCache, setTranslationsCache] = useState<Map<string, Map<string, string>>>(new Map());

  // Update localStorage when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', currentLanguage);
    }
  }, [currentLanguage]);

  const setLanguage = useCallback((lang: string) => {
    if (languages.some(l => l.code === lang)) {
      setCurrentLanguage(lang);
    } else {
      console.warn(`Attempted to set unsupported language: ${lang}`);
    }
  }, [languages]);

  const translate = useCallback(async (text: string, sourceLang: string = defaultLanguage): Promise<string> => {
    if (currentLanguage === sourceLang) {
      return text;
    }

    // Check cache first
    const cachedTranslation = translationsCache.get(text)?.get(currentLanguage);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: currentLanguage,
          sourceLanguage: sourceLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to translate text');
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      // Update cache
      setTranslationsCache(prevCache => {
        const newCache = new Map(prevCache);
        const textTranslations = newCache.get(text) || new Map();
        textTranslations.set(currentLanguage, translatedText);
        newCache.set(text, textTranslations);
        return newCache;
      });

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
      return text; // Return original text on error
    }
  }, [currentLanguage, defaultLanguage, translationsCache, languages]);

  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    translate,
    availableLanguages: languages,
  }), [currentLanguage, setLanguage, translate, languages]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 