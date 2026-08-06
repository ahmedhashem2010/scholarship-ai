"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";
import { translate, localiseNumber, type Language } from "@/lib/i18n";

const STORAGE_KEY = "smartscholar.lang";

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  /** Translate a dictionary key into the active language. */
  t: (key: string) => string;
  /** Pick between two values without adding a dictionary entry. */
  pick: <T>(ar: T, en: T) => T;
  /** Render a number in Arabic-Indic digits when the UI is Arabic. */
  num: (n: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English is the default on first visit. A returning user's saved choice is
  // restored from localStorage after mount (below), so anyone who picked Arabic
  // keeps it — but new visitors always start in English.
  const [language, setLanguageState] = useState<Language>("en");

  // Restore the saved choice after mount. The server and the first client
  // render must produce identical markup, so storage can't be read during
  // render without causing a hydration mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") setLanguageState(saved);
    } catch {
      // Private browsing or storage disabled — keep the default.
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    // Lets CSS target the language directly, e.g. to swap the heading font.
    document.documentElement.dataset.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Non-fatal: the choice just won't survive a reload.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  const value: LanguageContextType = {
    language,
    isRTL: language === "ar",
    toggleLanguage,
    setLanguage,
    t: (key: string) => translate(key, language),
    pick: <T,>(ar: T, en: T) => (language === "ar" ? ar : en),
    num: (n: number | string) => localiseNumber(n, language),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
