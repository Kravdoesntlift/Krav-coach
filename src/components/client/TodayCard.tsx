"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkoutDay } from "@/lib/supabase/types";
import LiveWorkout from "./LiveWorkout";
import { haptic, HAPTIC } from "@/lib/haptic";
import { useLang } from "@/lib/i18n/useLang";

interface Props {
  day: WorkoutDay & { exercises?: { id: string; name: string; sets: number; reps: number; notes?: string | null; video_url?: string | null; order_index: number; superset_group?: string | null }[] };
  clientId: string;
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

export default function TodayCard({ day, clientId, isCompleted, completedCount, totalCount }: Props) {
  const [liveMode, setLiveMode] = useState(false);
  const [done, setDone] = useState(isCompleted);
  const { lang } = useLang();
  const router = useRouter();
  const isEN = lang === "en";

  const exercises = day.exercises ?? [];
  const isRest = day.is_rest;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isRest) {
    return (
      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">😴</div>
        <div>
          <p className="text-white font-bold">{isEN ? "Rest day" : "Dia de descanso"}</p>
          <p className="text-zinc-500 text-sm mt-0.5">{day.label || (isEN ? "Rest well — your body needs it" : "Recupera bem — o teu corpo precisa")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {liveMode && (
        <LiveWorkout
          exercises={exercises}
          dayId={day.id}
          clientId={clientId}
          dayLabel={day.label || (isEN ? "Today's workout" : "Treino de hoje")}
          onComplete={async () => { setDone(true); setLiveMode(false); router.refresh(); }}
          onClose={() => setLiveMode(false)}
        />
      )}

      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(10,10,12,0.95) 60%)",
          border: "1px solid rgba(201,168,76,0.25)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent 70%)" }}
        />

        <div className="relative p-4 md:p-5 space-y-3 md:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-1">{isEN ? "Today's workout" : "Treino de hoje"}</p>
              <h2 className="text-white font-black text-xl leading-tight">
                {day.label || `${exercises.length} ${isEN ? "exercises" : "exercícios"}`}
              </h2>
            </div>
            {done ? (
              <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <span className="text-green-400 text-lg">✓</span>
              </div>
            ) : (
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-black font-black text-sm"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {exercises.length}
              </div>
            )}
          </div>

          {/* Weekly progress mini bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: pct === 100 ? "#4ade80" : "linear-gradient(90deg,#E8C96B,#C9A84C)" }}
              />
            </div>
            <span className="text-xs text-zinc-500 shrink-0">{completedCount}/{totalCount} {isEN ? "this week" : "esta semana"}</span>
          </div>

          {/* Exercises preview */}
          {exercises.length > 0 && (
            <div className="space-y-1.5">
              {exercises
                .sort((a, b) => a.order_index - b.order_index)
                .slice(0, 4)
                .map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-brand-gold/60 shrink-0" />
                    <span className="text-zinc-300 text-sm flex-1 truncate">{ex.name}</span>
                    <span className="text-zinc-600 text-xs shrink-0">{ex.sets}×{ex.reps}</span>
                  </div>
                ))}
              {exercises.length > 4 && (
                <p className="text-zinc-600 text-xs pl-4">+{exercises.length - 4} {isEN ? "exercises" : "exercícios"}</p>
              )}
            </div>
          )}

          {/* CTA */}
          {!done ? (
            <button
              onClick={() => { haptic(HAPTIC.light); setLiveMode(true); }}
              className="w-full py-3 rounded-2xl font-black text-black text-sm tracking-wide transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              {isEN ? "▶ Start workout" : "▶ Iniciar treino"}
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
              <p className="text-green-400 font-bold text-sm">{isEN ? "Workout done today 🔥" : "Treino concluído hoje 🔥"}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
