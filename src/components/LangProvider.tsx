"use client";
import { createContext, useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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

async function persistLangToProfile(lang: Lang) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ lang }).eq("id", user.id);
    }
  } catch {
    // Non-critical: cookie/localStorage are the source of truth for the UI
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const detected = detectLang();
    setLangState(detected);
    document.cookie = `krav_lang=${detected}; path=/; max-age=31536000; SameSite=Lax`;
    // Sync to DB so server-side email/push can read it
    persistLangToProfile(detected);
  }, []);

  const setLang = (newLang: Lang) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    document.cookie = `krav_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(newLang);
    persistLangToProfile(newLang);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
