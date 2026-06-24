"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/useLang";

interface Activity {
  id: string;
  icon: string;
  label: string;
  description: string;
}

const ACTIVITIES_PT: Activity[] = [
  { id: "stretch", icon: "🧘", label: "10 min de alongamentos", description: "Foca nos grupos musculares mais trabalhados" },
  { id: "walk",    icon: "🚶", label: "Caminhada leve 20-30 min", description: "Ritmo confortável, sem esforço" },
  { id: "water",   icon: "💧", label: "Beber 2-3L de água", description: "Recuperação começa pela hidratação" },
  { id: "sleep",   icon: "🌙", label: "Dormir 7-9 horas", description: "O músculo cresce enquanto dormes" },
];

const ACTIVITIES_EN: Activity[] = [
  { id: "stretch", icon: "🧘", label: "10 min of stretching", description: "Focus on the muscle groups you trained most" },
  { id: "walk",    icon: "🚶", label: "Light walk 20-30 min", description: "Comfortable pace, no effort" },
  { id: "water",   icon: "💧", label: "Drink 2-3L of water", description: "Recovery starts with hydration" },
  { id: "sleep",   icon: "🌙", label: "Sleep 7-9 hours", description: "Muscle grows while you rest" },
];

interface Props {
  label?: string | null;
  nextTrainingDay?: string | null;
}

export default function RestDayCard({ label, nextTrainingDay }: Props) {
  const { lang } = useLang();
  const isEN = lang === "en";
  const activities = isEN ? ACTIVITIES_EN : ACTIVITIES_PT;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pct = Math.round((checked.size / activities.length) * 100);
  const allDone = checked.size === activities.length;

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(96,165,250,0.07) 0%, rgba(10,10,12,0.96) 60%)",
        border: "1px solid rgba(96,165,250,0.14)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }}
      />

      <div className="relative p-4 md:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{
                background: "rgba(96,165,250,0.1)",
                border: "1px solid rgba(96,165,250,0.18)",
              }}
            >
              {allDone ? "🌟" : "💤"}
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">
                {isEN ? "Today" : "Hoje"}
              </p>
              <h2 className="text-white font-black text-lg leading-tight">
                {label || (isEN ? "Rest & Recover" : "Descanso Ativo")}
              </h2>
            </div>
          </div>
          {nextTrainingDay && (
            <div className="text-right shrink-0">
              <p className="text-zinc-600 text-[10px]">{isEN ? "Next training" : "Próx. treino"}</p>
              <p className="text-blue-400 text-xs font-semibold">{nextTrainingDay}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-zinc-500 text-xs">
              {isEN ? "Recovery checklist" : "Checklist de recuperação"}
            </p>
            <span className="text-blue-400/80 text-xs font-semibold">{pct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: allDone
                  ? "linear-gradient(90deg,#34d399,#10b981)"
                  : "linear-gradient(90deg,#60a5fa,#3b82f6)",
              }}
            />
          </div>
        </div>

        {/* Activity list */}
        <div className="space-y-2">
          {activities.map((act) => {
            const done = checked.has(act.id);
            return (
              <button
                key={act.id}
                onClick={() => toggle(act.id)}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all text-left active:scale-[0.98]"
                style={{
                  background: done
                    ? "rgba(96,165,250,0.08)"
                    : "rgba(39,39,42,0.5)",
                  border: `1px solid ${done ? "rgba(96,165,250,0.25)" : "rgba(63,63,70,0.5)"}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-all"
                  style={{ background: done ? "rgba(96,165,250,0.15)" : "rgba(39,39,42,0.9)" }}
                >
                  {done ? (
                    <span className="text-blue-400 text-sm font-black">✓</span>
                  ) : (
                    act.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      done ? "text-zinc-500 line-through" : "text-white"
                    }`}
                  >
                    {act.label}
                  </p>
                  <p className="text-zinc-600 text-xs truncate">{act.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Completion message */}
        {allDone && (
          <div
            className="text-center py-2.5 rounded-2xl"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
          >
            <p className="text-green-400 text-sm font-bold">
              {isEN ? "Perfect recovery day! 🌟" : "Dia de recuperação perfeito! 🌟"}
            </p>
            <p className="text-green-400/50 text-xs mt-0.5">
              {isEN ? "Your body will thank you tomorrow." : "O teu corpo vai agradecer amanhã."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
