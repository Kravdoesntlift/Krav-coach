"use client";
import { useContext } from "react";
import { LangContext } from "@/components/LangProvider";
import { t, type TranslationKey, type Lang } from "@/lib/i18n";

export function useLang() {
  const { lang, setLang } = useContext(LangContext);

  return {
    lang,
    setLang,
    t: (key: TranslationKey) => t(key, lang),
  };
}

export type { Lang, TranslationKey };
