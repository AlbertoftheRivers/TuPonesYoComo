import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredLanguage,
  writeStoredLanguage,
  webTranslations,
  type SupportedWebLanguage,
} from "./webI18n";

function applyParams(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  let out = str;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}

interface WebLanguageContextValue {
  language: SupportedWebLanguage;
  setLanguage: (lang: SupportedWebLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const WebLanguageContext = createContext<WebLanguageContextValue | undefined>(undefined);

export function WebLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedWebLanguage>(() => readStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: SupportedWebLanguage) => {
    writeStoredLanguage(lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = webTranslations[language] ?? webTranslations.es;
      const fall = webTranslations.es;
      const raw = dict[key] ?? fall[key] ?? key;
      return applyParams(raw, params);
    },
    [language]
  );

  return (
    <WebLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </WebLanguageContext.Provider>
  );
}

export function useWebLanguage() {
  const ctx = useContext(WebLanguageContext);
  if (!ctx) {
    throw new Error("useWebLanguage must be used within WebLanguageProvider");
  }
  return ctx;
}
