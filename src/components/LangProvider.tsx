"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

const STORAGE_KEY = "krav_lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LangContext = createContext<LangContextValue>({
  lang: "pt",
  setLang: () => {},
});

function detectLang(): Lang {
  if (typeof window === "undefined") return "pt";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "pt" || stored === "en") return stored;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("en") || browser.startsWith("de") || browser.startsWith("fr") || browser.startsWith("it")) return "en";
  return "pt";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const detected = detectLang();
    setLangState(detected);
    // Sync cookie on first load so server components get the right value on next request
    document.cookie = `krav_lang=${detected}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const setLang = (newLang: Lang) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    // Also set cookie so server components can read the preference
    document.cookie = `krav_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(newLang);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
