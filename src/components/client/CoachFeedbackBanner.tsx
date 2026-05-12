"use client";

import { useState, useEffect } from "react";

interface Props {
  message: string;
  weekStart: string;
}

export default function CoachFeedbackBanner({ message, weekStart }: Props) {
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
        aria-label="Fechar"
      >
        ✕
      </button>
      <p className="text-xs text-brand-gold font-semibold mb-1.5 uppercase tracking-wide pr-6">
        Mensagem do teu coach
      </p>
      <p className="text-gray-200 text-sm leading-relaxed">{message}</p>
    </div>
  );
}
