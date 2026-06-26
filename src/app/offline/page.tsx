"use client";

import { useEffect, useState } from "react";
import { getOfflineQueue } from "@/hooks/useOfflineQueue";

interface CachedDay {
  label: string;
  exercises: string[];
  isRest: boolean;
}

interface CachedWorkout {
  label: string | null;
  exercises: string[];
  isRest: boolean;
  weekDays: CachedDay[];
  cachedAt: string;
}

export default function OfflinePage() {
  const [workout, setWorkout] = useState<CachedWorkout | null>(null);
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("krav_today_workout");
      if (raw) setWorkout(JSON.parse(raw));
    } catch {}
    setQueueLen(getOfflineQueue().length);
  }, []);

  const cachedDate = workout?.cachedAt
    ? new Date(workout.cachedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-5 py-10 max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <span className="text-2xl font-black tracking-tighter">
          KRAV<span style={{ color: "#C9A84C" }}>.</span>
        </span>
      </div>

      {/* Status banner */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <span className="text-2xl shrink-0">📡</span>
        <div>
          <p className="text-white font-bold text-sm">Sem ligação</p>
          <p className="text-zinc-500 text-xs mt-0.5">A mostrar dados guardados localmente</p>
        </div>
      </div>

      {/* Offline queue */}
      {queueLen > 0 && (
        <div
          className="rounded-2xl px-4 py-3 mb-6"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <p className="text-brand-gold text-sm font-bold">
            {queueLen} {queueLen === 1 ? "ação pendente" : "ações pendentes"}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Serão sincronizadas quando a ligação for restaurada.
          </p>
        </div>
      )}

      {/* Cached workout */}
      {workout ? (
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">Treino de hoje</p>
            {cachedDate && (
              <p className="text-zinc-700 text-[10px]">Guardado {cachedDate}</p>
            )}
          </div>

          {workout.isRest ? (
            <div
              className="rounded-2xl px-5 py-6 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-4xl">💤</span>
              <p className="text-white font-bold mt-3">Dia de descanso</p>
              <p className="text-zinc-500 text-sm mt-1">Recupera bem hoje!</p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {workout.label && (
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <p className="text-white font-bold text-sm">{workout.label}</p>
                </div>
              )}
              {workout.exercises.length > 0 ? (
                <ul className="divide-y" style={{ "--divide-color": "rgba(255,255,255,0.05)" } as React.CSSProperties}>
                  {workout.exercises.map((ex, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-white text-sm">{ex}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm px-4 py-4">Sem exercícios guardados.</p>
              )}
            </div>
          )}

          {/* Week overview */}
          {workout.weekDays.length > 0 && (
            <div>
              <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-3">Esta semana</p>
              <div className="grid grid-cols-7 gap-1">
                {workout.weekDays.map((d, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] text-center"
                    style={{
                      background: d.isRest
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(201,168,76,0.08)",
                      border: d.isRest
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    <span>{d.isRest ? "💤" : "💪"}</span>
                    <span className="text-zinc-600 leading-tight px-0.5 truncate w-full text-center">
                      {d.isRest ? "Desc" : (d.exercises.length + "ex")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-5xl">📭</span>
          <p className="text-white font-bold">Sem dados guardados</p>
          <p className="text-zinc-500 text-sm">
            Abre a app enquanto estás online para guardar o teu plano para consulta offline.
          </p>
        </div>
      )}

      {/* Motivational quote */}
      <div
        className="mt-8 px-5 py-4 rounded-2xl text-center"
        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)" }}
      >
        <p className="text-brand-gold text-sm font-semibold italic">
          &ldquo;A disciplina não precisa de wi-fi.&rdquo;
        </p>
      </div>

      {/* Retry */}
      <button
        onClick={() => window.location.reload()}
        className="mt-6 w-full py-4 rounded-2xl font-black text-black text-sm transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
