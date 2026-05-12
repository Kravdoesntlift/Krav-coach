"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Exercise } from "@/lib/supabase/types";

interface Props {
  exercises: Exercise[];
  dayId: string;
  clientId: string;
  dayLabel: string;
  onComplete: (feeling: string, note: string) => Promise<void>;
  onClose: () => void;
}

interface SetLog {
  weight: string;
  reps: string;
  done: boolean;
}

export default function LiveWorkout({ exercises, dayId, clientId, dayLabel, onComplete, onClose }: Props) {
  const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);
  const [step, setStep] = useState(0);          // current exercise index
  const [setLogs, setSetLogs] = useState<SetLog[][]>(
    sorted.map((ex) => Array.from({ length: ex.sets }, () => ({ weight: "", reps: String(ex.reps), done: false })))
  );
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  const [feeling, setFeeling] = useState("");
  const [note, setNote] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cur = sorted[step];
  const totalSteps = sorted.length;
  const progress = ((step) / totalSteps) * 100;

  // ── Rest timer ──────────────────────────────────────────────
  const startRest = useCallback((seconds: number) => {
    setRestLeft(seconds);
    setRestActive(true);
  }, []);

  useEffect(() => {
    if (!restActive) return;
    timerRef.current = setInterval(() => {
      setRestLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setRestActive(false);
          // Vibrate on phones
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [restActive]);

  function skipRest() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestActive(false);
    setRestLeft(0);
  }

  // ── Mark set done ─────────────────────────────────────────
  function toggleSet(exIdx: number, setIdx: number) {
    setSetLogs((prev) => {
      const copy = prev.map((s) => s.map((r) => ({ ...r })));
      const wasNotDone = !copy[exIdx][setIdx].done;
      copy[exIdx][setIdx].done = !copy[exIdx][setIdx].done;
      if (wasNotDone) startRest(restSeconds);
      return copy;
    });
  }

  function updateLog(exIdx: number, setIdx: number, field: "weight" | "reps", val: string) {
    setSetLogs((prev) => {
      const copy = prev.map((s) => s.map((r) => ({ ...r })));
      copy[exIdx][setIdx][field] = val;
      return copy;
    });
  }

  // ── Save logs + complete ─────────────────────────────────
  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const today = new Date();
    const logged_at = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    await Promise.all(
      sorted.map((ex, i) => {
        const sets = setLogs[i].map((s) => ({
          weight_kg: s.weight ? parseFloat(s.weight) : null,
          reps: parseInt(s.reps) || ex.reps,
          done: s.done,
        }));
        return supabase.from("workout_logs").upsert({
          client_id: clientId,
          exercise_name: ex.name,
          day_id: dayId,
          logged_at,
          sets,
        }, { onConflict: "client_id,exercise_name,day_id,logged_at" });
      })
    );

    await onComplete(feeling || "💪", note);
    setSaving(false);
  }

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const restPct = restLeft / restSeconds;

  // ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe-top pt-5 pb-3 border-b border-zinc-800">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
          ✕
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm">{dayLabel}</p>
          <p className="text-gray-500 text-xs">{step + 1} / {totalSteps} exercícios</p>
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-brand-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Rest timer overlay */}
      {restActive && (
        <div className="absolute inset-0 z-10 bg-zinc-950/95 flex flex-col items-center justify-center gap-6">
          <p className="text-gray-400 text-sm uppercase tracking-widest font-medium">Tempo de descanso</p>

          {/* Circle timer */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#27272a" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="#C9A84C" strokeWidth="8"
                strokeDasharray={`${276 * restPct} 276`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-5xl font-bold tabular-nums">{fmt(restLeft)}</span>
              <span className="text-gray-500 text-xs mt-1">restante</span>
            </div>
          </div>

          {/* Adjust */}
          <div className="flex gap-3">
            {[30, 60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => { setRestSeconds(s); startRest(s); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${restSeconds === s ? "bg-brand-gold text-black font-semibold" : "bg-zinc-800 text-gray-400 hover:text-white"}`}
              >
                {s}s
              </button>
            ))}
          </div>

          <button
            onClick={skipRest}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            Saltar descanso →
          </button>
        </div>
      )}

      {/* Finishing screen */}
      {finishing ? (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          <div className="text-center pt-6">
            <p className="text-5xl mb-3">🏆</p>
            <h2 className="text-white text-2xl font-bold">Treino concluído!</h2>
            <p className="text-gray-400 text-sm mt-1">Como correu?</p>
          </div>

          {/* Feeling */}
          <div className="grid grid-cols-4 gap-2">
            {[{ emoji: "😓", label: "Pesado" }, { emoji: "😐", label: "Ok" }, { emoji: "💪", label: "Bem" }, { emoji: "🔥", label: "Top" }].map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => setFeeling(emoji)}
                className={`flex flex-col items-center py-3 rounded-xl text-2xl transition-all ${feeling === emoji ? "bg-brand-gold/20 ring-2 ring-brand-gold scale-105" : "bg-zinc-800 hover:bg-zinc-700"}`}
              >
                {emoji}
                <span className="text-xs text-gray-400 mt-1">{label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota rápida... (opcional)"
            rows={2}
            maxLength={200}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
          />

          {/* Summary */}
          <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Resumo</p>
            {sorted.map((ex, i) => {
              const done = setLogs[i].filter((s) => s.done).length;
              const totalSets = setLogs[i].length;
              const vol = setLogs[i].filter(s => s.done).reduce((sum, s) => sum + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0);
              return (
                <div key={ex.id} className="flex items-center justify-between">
                  <span className="text-white text-sm truncate max-w-[60%]">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{done}/{totalSets} séries</span>
                    {vol > 0 && <span className="text-brand-gold text-xs">{vol.toFixed(0)}kg</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-4 bg-brand-gold hover:bg-brand-gold-dark text-black font-bold rounded-2xl text-lg transition-colors disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar treino"}
          </button>
        </div>
      ) : (
        <>
          {/* Exercise cards — scrollable */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              // Shared expanded content (set logs + navigation)
              const renderExpanded = (exIdx: number, ex: (typeof sorted)[0]) => (
                <div className="px-5 pb-5 space-y-3">
                  {ex.video_url && (
                    <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-brand-gold text-xs hover:underline">
                      <span>▶</span> Ver demonstração
                    </a>
                  )}
                  {ex.notes && <p className="text-gray-500 text-xs italic">{ex.notes}</p>}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs text-gray-500 px-1">
                      <span>#</span><span>Peso (kg)</span><span>Reps</span><span></span>
                    </div>
                    {setLogs[exIdx].map((s, si) => (
                      <div key={si} className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl transition-colors ${s.done ? "bg-green-500/10 border border-green-500/20" : "bg-zinc-800"}`}>
                        <span className="text-gray-500 text-xs text-center">{si + 1}</span>
                        <input type="number" inputMode="decimal" value={s.weight}
                          onChange={(e) => updateLog(exIdx, si, "weight", e.target.value)}
                          placeholder="—"
                          className="bg-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                        <input type="number" inputMode="numeric" value={s.reps}
                          onChange={(e) => updateLog(exIdx, si, "reps", e.target.value)}
                          className="bg-zinc-700 rounded-lg px-2 py-1.5 text-white text-sm text-center w-full focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                        <button onClick={() => toggleSet(exIdx, si)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${s.done ? "bg-green-500 text-white scale-105" : "bg-zinc-700 text-gray-400 hover:bg-green-500/30"}`}>
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {exIdx > 0 && (
                      <button onClick={() => setStep((s) => s - 1)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-gray-400 text-sm hover:bg-zinc-700 transition-colors">
                        ← Anterior
                      </button>
                    )}
                    {exIdx < totalSteps - 1 ? (
                      <button onClick={() => setStep((s) => s + 1)}
                        className="flex-1 py-3 rounded-xl bg-brand-gold text-black text-sm font-bold hover:bg-brand-gold-dark transition-colors">
                        Próximo →
                      </button>
                    ) : (
                      <button onClick={() => setFinishing(true)}
                        className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors">
                        Concluir treino 🏆
                      </button>
                    )}
                  </div>
                </div>
              );

              const items: React.ReactNode[] = [];
              let i = 0;
              while (i < sorted.length) {
                const ex = sorted[i];
                const group = (ex as Exercise & { superset_group?: string | null }).superset_group?.trim() || null;

                if (group) {
                  // Collect all consecutive exercises sharing this superset group
                  const groupItems: Array<{ ex: (typeof sorted)[0]; idx: number }> = [];
                  let j = i;
                  while (
                    j < sorted.length &&
                    ((sorted[j] as Exercise & { superset_group?: string | null }).superset_group?.trim() || null) === group
                  ) {
                    groupItems.push({ ex: sorted[j], idx: j });
                    j++;
                  }
                  const isGroupActive = groupItems.some(({ idx }) => idx === step);

                  items.push(
                    <div key={`ss-${group}-${i}`} className={`border-l-2 border-orange-500/60 transition-opacity ${!isGroupActive ? "opacity-40" : ""}`}>
                      <div className="px-5 pt-2 pb-1 flex items-center gap-2">
                        <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">SS {group}</span>
                        <span className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Superset — sem descanso</span>
                      </div>
                      {groupItems.map(({ ex: gex, idx: gIdx }) => (
                        <div key={gex.id} className={`border-b border-zinc-800/50 transition-colors ${gIdx === step ? "bg-zinc-900/80" : ""}`}>
                          <button onClick={() => setStep(gIdx)} className="w-full flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3 text-left">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                setLogs[gIdx].every(s => s.done) ? "bg-green-500 text-white" : gIdx === step ? "bg-orange-500 text-black" : "bg-zinc-700 text-gray-400"
                              }`}>
                                {setLogs[gIdx].every(s => s.done) ? "✓" : gIdx + 1}
                              </div>
                              <div>
                                <p className={`font-semibold text-sm ${gIdx === step ? "text-white" : "text-gray-400"}`}>{gex.name}</p>
                                <p className="text-gray-500 text-xs">{gex.sets} séries × {gex.reps} reps</p>
                              </div>
                            </div>
                            {gIdx === step && <span className="text-orange-400 text-xs">ativo ▸</span>}
                          </button>
                          {gIdx === step && renderExpanded(gIdx, gex)}
                        </div>
                      ))}
                    </div>
                  );
                  i = j;
                } else {
                  // Normal exercise (no superset)
                  const exIdx = i;
                  items.push(
                    <div key={ex.id} className={`border-b border-zinc-800/50 transition-colors ${exIdx === step ? "bg-zinc-900" : "opacity-40"}`}>
                      <button onClick={() => setStep(exIdx)} className="w-full flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3 text-left">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            setLogs[exIdx].every(s => s.done) ? "bg-green-500 text-white" : exIdx === step ? "bg-brand-gold text-black" : "bg-zinc-700 text-gray-400"
                          }`}>
                            {setLogs[exIdx].every(s => s.done) ? "✓" : exIdx + 1}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${exIdx === step ? "text-white" : "text-gray-400"}`}>{ex.name}</p>
                            <p className="text-gray-500 text-xs">{ex.sets} séries × {ex.reps} reps</p>
                          </div>
                        </div>
                        {exIdx === step && <span className="text-brand-gold text-xs">ativo ▸</span>}
                      </button>
                      {exIdx === step && renderExpanded(exIdx, ex)}
                    </div>
                  );
                  i++;
                }
              }
              return items;
            })()}
          </div>

          {/* Bottom bar */}
          <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
            <button
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); startRest(restSeconds); }}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors"
            >
              ⏱ {fmt(restSeconds)} descanso
            </button>
            <button
              onClick={() => setFinishing(true)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors"
            >
              Terminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
