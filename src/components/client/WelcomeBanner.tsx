"use client";

import { useState, useEffect } from "react";
import { markWelcomed } from "@/app/client/actions_persistence";

interface Props {
  clientName: string;
  coachName: string;
  coachTagline?: string | null;
  coachId?: string | null;
  welcomed: boolean;
  onClose?: () => void;
}

export default function WelcomeBanner({ clientName, coachName, coachTagline, coachId, welcomed, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If server says already welcomed, don't show
    if (welcomed) return;
    // Only show when there's a real coach assigned
    if (!coachId) return;

    // Show banner and mark as welcomed immediately (fire and forget)
    setVisible(true);
    markWelcomed();
  }, [coachId, welcomed]);

  if (!visible) return null;

  const firstName = clientName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
        style={{
          background: "linear-gradient(160deg, rgba(39,39,42,0.98) 0%, rgba(18,18,22,1) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Logo */}
        <p className="text-3xl font-black tracking-[-0.04em] text-white mb-6">
          KRAV<span className="text-brand-gold">.</span>
        </p>

        {/* Welcome */}
        <div className="mb-5">
          <p className="text-zinc-500 text-sm mb-1">Bem-vindo ao teu programa,</p>
          <h2 className="text-3xl font-black text-white tracking-tight">{firstName}</h2>
        </div>

        {/* Coach card */}
        <div
          className="rounded-2xl p-4 mb-5"
          style={{
            background: "rgba(201,168,76,0.07)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <p className="text-zinc-500 text-xs mb-1 uppercase tracking-widest font-semibold">O teu coach</p>
          <p className="text-white font-bold text-lg">{coachName}</p>
          {coachTagline && (
            <p className="text-zinc-400 text-xs mt-1 italic">"{coachTagline}"</p>
          )}
        </div>

        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Estás a entrar num programa de treino personalizado.<br />
          Dá o teu melhor esta semana. 🔥
        </p>

        <button
          onClick={() => { setVisible(false); onClose?.(); }}
          className="btn-primary w-full py-3 text-base"
        >
          Vamos lá 💪
        </button>
      </div>
    </div>
  );
}
