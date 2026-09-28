// Native equivalent of the web app's cookie-based getLanguage() (src/lib/
// language.ts there). On-device SQLite settings table replaces the cookie;
// a React Context replaces "read per server request" since there's no
// server here — every screen reads the current language from this
// context instead of calling an async getLanguage() each render.
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Language } from "./types";
import { getSetting, setSetting } from "./db";

const VALID: Language[] = ["en", "uz", "ru", "zh", "fr"];
const SETTINGS_KEY = "language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = getSetting(SETTINGS_KEY);
    if (stored && VALID.includes(stored as Language)) setLanguageState(stored as Language);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setSetting(SETTINGS_KEY, lang);
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
