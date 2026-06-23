"use client";
import { useLang } from "@/lib/i18n/useLang";

export default function LanguageSelector() {
  const { t, lang, setLang } = useLang();

  return (
    <div className="mt-6 space-y-2">
      <label className="text-sm text-gray-400">{t("language")}</label>
      <div className="flex gap-3">
        <button
          onClick={() => setLang("pt")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            lang === "pt"
              ? "bg-[#C9A84C] text-black"
              : "bg-zinc-800 text-gray-400 hover:text-white"
          }`}
        >
          Português
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            lang === "en"
              ? "bg-[#C9A84C] text-black"
              : "bg-zinc-800 text-gray-400 hover:text-white"
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
}
