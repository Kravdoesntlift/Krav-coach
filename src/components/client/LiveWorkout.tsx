"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Exercise } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n/useLang";

// Strings not in the shared dictionary
const extra = {
  last_session:       { pt: (kg: number, reps: number, days: number) => `Última sessão: ${kg}kg × ${reps} (há ${days} dias)`,
                        en: (kg: number, reps: number, days: number) => `Last session: ${kg}kg × ${reps} (${days} days ago)` },
  exercises_count:    { pt: "exercícios",               en: "exercises" },
  rest_remaining:     { pt: "restante",                  en: "remaining" },
  rest_time:          { pt: "Tempo de descanso",         en: "Rest time" },
  superset_no_rest:   { pt: "Superset — sem descanso",  en: "Superset — no rest" },
  active_marker:      { pt: "ativo ▸",                  en: "active ▸" },
  sets_x_reps:        { pt: (s: number, r: number | string) => `${s} séries × ${r} reps`,
                        en: (s: number, r: number | string) => `${s} sets × ${r} reps` },
  series_done:        { pt: (d: number, t: number) => `${d}/${t} séries`,
                        en: (d: number, t: number) => `${d}/${t} sets` },
  summary:            { pt: "Resumo",                    en: "Summary" },
  how_was:            { pt: "Como correu?",              en: "How did it go?" },
  note_placeholder:   { pt: "Nota rápida... (opcional)", en: "Quick note... (optional)" },
  save_workout:       { pt: "Guardar treino",            en: "Save workout" },
  saving:             { pt: "A guardar...",              en: "Saving..." },
  finish_btn:         { pt: "Terminar",                  en: "Finish" },
  prev_btn:           { pt: "← Anterior",               en: "← Previous" },
  next_btn:           { pt: "Próximo →",                en: "Next →" },
  finish_workout_btn: { pt: "Concluir treino 🏆",       en: "Finish workout 🏆" },
  workout_done_title: { pt: "Treino concluído!",        en: "Workout done!" },
  see_demo:           { pt: "Ver demonstração",          en: "Watch demo" },
  feeling_heavy:      { pt: "Pesado",                    en: "Heavy" },
  feeling_ok:         { pt: "Ok",                        en: "Ok" },
  feeling_good:       { pt: "Bem",                       en: "Good" },
  feeling_top:        { pt: "Top",                       en: "Top" },
  rest_bottom_bar:    { pt: (fmt: string) => `⏱ ${fmt} descanso`, en: (fmt: string) => `⏱ ${fmt} rest` },
} as const;

function beep(freq = 880, duration = 0.15, vol = 0.4) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch { /* ignore if AudioContext not available */ }
}

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
  const { t, lang } = useLang();
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
  const [elapsed, setElapsed] = useState(0);
  const [prs, setPrs] = useState<Set<string>>(new Set());
  const [prevLogs, setPrevLogs] = useState<Map<string, { topWeight: number; reps: number; date: string }>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());

  const cur = sorted[step];
  const totalSteps = sorted.length;
  const progress = ((step) / totalSteps) * 100;

  // Elapsed workout timer
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  // Load previous PRs and last session data for these exercises
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const exerciseNames = sorted.map((e) => e.name);
      const { data } = await supabase
        .from("workout_logs")
        .select("exercise_name, sets, logged_at")
        .eq("client_id", clientId)
        .in("exercise_name", exerciseNames)
        .order("logged_at", { ascending: false })
        .limit(exerciseNames.length * 3);
      if (!data) return;

      const best: Record<string, number> = {};
      const lastSessionMap = new Map<string, { topWeight: number; reps: number; date: string }>();

      for (const log of data) {
        const sets = log.sets as { weight_kg?: number; reps?: number; done?: boolean }[];
        const doneSets = sets.filter((s) => s.done !== false);
        const maxSet = doneSets.reduce<{ weight_kg: number; reps: number } | null>((top, s) => {
          const w = s.weight_kg ?? 0;
          if (!top || w > top.weight_kg) return { weight_kg: w, reps: s.reps ?? 0 };
          return top;
        }, null);

        if (maxSet && maxSet.weight_kg > 0) {
          if (!best[log.exercise_name] || maxSet.weight_kg > best[log.exercise_name]) {
            best[log.exercise_name] = maxSet.weight_kg;
          }
          if (!lastSessionMap.has(log.exercise_name)) {
            lastSessionMap.set(log.exercise_name, {
              topWeight: maxSet.weight_kg,
              reps: maxSet.reps,
              date: log.logged_at as string,
            });
          }
        }
      }

      setPrs(new Set(Object.keys(best)));
      setPrevLogs(lastSessionMap);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          beep(880, 0.15); setTimeout(() => beep(1100, 0.2), 200);
          return 0;
        }
        if (s === 4) beep(440, 0.1); // warning beep at 3s
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
  const fmtElapsed = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const restPct = restLeft / restSeconds;

  function checkPR(exIdx: number, setIdx: number) {
    const log = setLogs[exIdx][setIdx];
    const w = parseFloat(log.weight);
    if (!w) return false;
    const ex = sorted[exIdx];
    return prs.has(ex.name) && w > 0;
  }

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
          <p className="text-gray-500 text-xs">{step + 1} / {totalSteps} {extra.exercises_count[lang]}</p>
        </div>
        <div className="w-9 text-right">
          <span className="text-xs text-zinc-500 tabular-nums font-mono">{fmtElapsed(elapsed)}</span>
        </div>
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
          <p className="text-gray-400 text-sm uppercase tracking-widest font-medium">{extra.rest_time[lang]}</p>

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
              <span className="text-gray-500 text-xs mt-1">{extra.rest_remaining[lang]}</span>
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
            {t("skip_rest")} →
          </button>
        </div>
      )}

      {/* Finishing screen */}
      {finishing ? (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          <div className="text-center pt-6">
            <p className="text-5xl mb-3">🏆</p>
            <h2 className="text-white text-2xl font-bold">{extra.workout_done_title[lang]}</h2>
            <p className="text-brand-gold font-bold text-sm mt-1">⏱ {fmtElapsed(elapsed)} {lang === "en" ? "of training" : "de treino"}</p>
            <p className="text-gray-400 text-xs mt-0.5">{extra.how_was[lang]}</p>
          </div>

          {/* Feeling */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { emoji: "😓", labelKey: "feeling_heavy" as const },
              { emoji: "😐", labelKey: "feeling_ok" as const },
              { emoji: "💪", labelKey: "feeling_good" as const },
              { emoji: "🔥", labelKey: "feeling_top" as const },
            ].map(({ emoji, labelKey }) => (
              <button
                key={emoji}
                onClick={() => setFeeling(emoji)}
                className={`flex flex-col items-center py-3 rounded-xl text-2xl transition-all ${feeling === emoji ? "bg-brand-gold/20 ring-2 ring-brand-gold scale-105" : "bg-zinc-800 hover:bg-zinc-700"}`}
              >
                {emoji}
                <span className="text-xs text-gray-400 mt-1">{extra[labelKey][lang]}</span>
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={extra.note_placeholder[lang]}
            rows={2}
            maxLength={200}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
          />

          {/* Summary */}
          <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">{extra.summary[lang]}</p>
            {sorted.map((ex, i) => {
              const done = setLogs[i].filter((s) => s.done).length;
              const totalSets = setLogs[i].length;
              const vol = setLogs[i].filter(s => s.done).reduce((sum, s) => sum + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0);
              return (
                <div key={ex.id} className="flex items-center justify-between">
                  <span className="text-white text-sm truncate max-w-[60%]">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">{extra.series_done[lang](done, totalSets)}</span>
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
            {saving ? extra.saving[lang] : extra.save_workout[lang]}
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
                      <span>▶</span> {extra.see_demo[lang]}
                    </a>
                  )}
                  {ex.notes && <p className="text-gray-500 text-xs italic">{ex.notes}</p>}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs text-gray-500 px-1">
                      <span>#</span><span>{t("weight_kg")}</span><span>{t("reps_done")}</span><span></span>
                    </div>
                    {setLogs[exIdx].map((s, si) => (
                      <div key={si} className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center p-2 rounded-xl transition-colors ${s.done && checkPR(exIdx, si) ? "bg-yellow-500/10 border border-yellow-500/30" : s.done ? "bg-green-500/10 border border-green-500/20" : "bg-zinc-800"}`}>
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
                        {extra.prev_btn[lang]}
                      </button>
                    )}
                    {exIdx < totalSteps - 1 ? (
                      <button onClick={() => setStep((s) => s + 1)}
                        className="flex-1 py-3 rounded-xl bg-brand-gold text-black text-sm font-bold hover:bg-brand-gold-dark transition-colors">
                        {extra.next_btn[lang]}
                      </button>
                    ) : (
                      <button onClick={() => setFinishing(true)}
                        className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors">
                        {extra.finish_workout_btn[lang]}
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
                        <span className="text-orange-400 text-xs font-semibold uppercase tracking-wide">{extra.superset_no_rest[lang]}</span>
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
                                <p className="text-gray-500 text-xs">{extra.sets_x_reps[lang](gex.sets, gex.reps)}</p>
                                {gIdx === step && (() => {
                                  const prev = prevLogs.get(gex.name);
                                  if (!prev) return null;
                                  const days = Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000);
                                  return <p className="text-xs text-zinc-500 mt-0.5">{extra.last_session[lang](prev.topWeight, prev.reps, days)}</p>;
                                })()}
                              </div>
                            </div>
                            {gIdx === step && <span className="text-orange-400 text-xs">{extra.active_marker[lang]}</span>}
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
                            <p className="text-gray-500 text-xs">{extra.sets_x_reps[lang](ex.sets, ex.reps)}</p>
                            {exIdx === step && (() => {
                              const prev = prevLogs.get(ex.name);
                              if (!prev) return null;
                              const days = Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000);
                              return <p className="text-xs text-zinc-500 mt-0.5">{extra.last_session[lang](prev.topWeight, prev.reps, days)}</p>;
                            })()}
                          </div>
                        </div>
                        {exIdx === step && <span className="text-brand-gold text-xs">{extra.active_marker[lang]}</span>}
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
              {extra.rest_bottom_bar[lang](fmt(restSeconds))}
            </button>
            <button
              onClick={() => setFinishing(true)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors"
            >
              {extra.finish_btn[lang]}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
