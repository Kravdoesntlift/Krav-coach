"use client";

import { useEffect, useState } from "react";
import Confetti from "@/components/ui/Confetti";
import type { Achievement } from "@/lib/achievements";
import { markAchievementsSeen } from "@/app/client/actions_persistence";

interface Props {
  achievements: Achievement[];
  seenAchievements: string[];
}

export default function AchievementUnlockModal({ achievements, seenAchievements }: Props) {
  const [queue, setQueue]         = useState<Achievement[]>([]);
  const [idx, setIdx]             = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [visible, setVisible]     = useState(false);

  useEffect(() => {
    const seen  = new Set(seenAchievements);
    const fresh = achievements.filter((a) => a.unlocked && !seen.has(a.id));
    if (fresh.length === 0) return;

    // Mark fresh achievements as seen (fire and forget)
    markAchievementsSeen(fresh.map((a) => a.id));

    setQueue(fresh);
    setIdx(0);
    setVisible(true);
    setShowConfetti(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (idx + 1 < queue.length) {
      setIdx((i) => i + 1);
      setShowConfetti(true);
    } else {
      setVisible(false);
    }
  }

  if (!visible || queue.length === 0) return null;

  const a = queue[idx];

  return (
    <>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} className="z-[300]" />}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        style={{ background: "rgba(0,0,0,0.92)" }}
      >
        <div className="max-w-xs w-full text-center animate-fade-in">

          {/* Glow ring + icon */}
          <div className="relative flex items-center justify-center mb-8">
            <div
              className="absolute w-40 h-40 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(201,168,76,0.35) 0%, transparent 70%)",
                filter: "blur(16px)",
              }}
            />
            <div
              className="relative w-28 h-28 rounded-3xl flex items-center justify-center text-6xl"
              style={{
                background: "linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.05))",
                border: "1px solid rgba(201,168,76,0.5)",
                boxShadow: "0 0 40px rgba(201,168,76,0.3)",
              }}
            >
              {a.icon}
            </div>
          </div>

          {/* Label */}
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-gold mb-3">
            Conquista desbloqueada!
          </p>

          {/* Title */}
          <h2 className="text-white text-2xl font-black tracking-tight mb-2">
            {a.title}
          </h2>

          {/* Description */}
          <p className="text-zinc-500 text-sm mb-8">{a.description}</p>

          {/* Counter dots */}
          {queue.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-6">
              {queue.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === idx ? "#C9A84C" : "rgba(201,168,76,0.25)" }}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={next}
            className="w-full py-3.5 rounded-2xl text-black font-bold text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
          >
            {idx + 1 < queue.length
              ? `Ver próxima conquista →`
              : "Continuar 🎉"}
          </button>
        </div>
      </div>
    </>
  );
}
