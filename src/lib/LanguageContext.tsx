import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadLanguage, saveLanguage, SupportedLanguage, translations } from './i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  useEffect(() => {
    // Load saved language on mount
    loadLanguage().then((lang) => {
      setLanguageState(lang);
    });
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    await saveLanguage(lang);
    setLanguageState(lang);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[language]?.[key] || translations['es']?.[key] || key;
    
    // Simple parameter replacement
    if (params) {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
      }, translation);
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

