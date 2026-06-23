"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/useLang";

interface Props {
  message: string;
  weekStart: string;
}

export default function CoachFeedbackBanner({ message, weekStart }: Props) {
  const { lang } = useLang();

  const extra = {
    coach_message: { pt: "Mensagem do teu coach", en: "Message from your coach" },
    close:         { pt: "Fechar",                en: "Close" },
  } as const;

  const key = `krav_feedback_dismissed_${weekStart}`;
  const [visible, setVisible] = useState(false);

  // Read localStorage only client-side
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [key]);

  function dismiss() {
    localStorage.setItem(key, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative border border-brand-gold/30 bg-brand-gold/5 rounded-2xl p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-gray-600 hover:text-white text-sm transition-colors leading-none"
        aria-label={extra.close[lang]}
      >
        ✕
      </button>
      <p className="text-xs text-brand-gold font-semibold mb-1.5 uppercase tracking-wide pr-6">
        {extra.coach_message[lang]}
      </p>
      <p className="text-gray-200 text-sm leading-relaxed">{message}</p>
    </div>
  );
}
