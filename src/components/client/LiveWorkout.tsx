"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Exercise } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n/useLang";

const extra = {
  last_session:       { pt: (kg: number, reps: number, days: number) => `Última: ${kg}kg × ${reps} (há ${days}d)`,
                        en: (kg: number, reps: number, days: number) => `Last: ${kg}kg × ${reps} (${days}d ago)` },
  exercises_count:    { pt: "exercícios",               en: "exercises" },
  rest_remaining:     { pt: "descansa",                 en: "rest" },
  rest_time:          { pt: "Descanso",                 en: "Rest" },
  superset_no_rest:   { pt: "Superset",                 en: "Superset" },
  active_marker:      { pt: "ativo",                    en: "active" },
  sets_x_reps:        { pt: (s: number, r: number | string) => `${s} × ${r}`,
                        en: (s: number, r: number | string) => `${s} × ${r}` },
  series_done:        { pt: (d: number, t: number) => `${d}/${t} séries`,
                        en: (d: number, t: number) => `${d}/${t} sets` },
  summary:            { pt: "Resumo do treino",         en: "Workout summary" },
  how_was:            { pt: "Como correu o treino?",    en: "How did it go?" },
  note_placeholder:   { pt: "Nota opcional...",         en: "Optional note..." },
  save_workout:       { pt: "Guardar treino",           en: "Save workout" },
  saving:             { pt: "A guardar...",             en: "Saving..." },
  finish_btn:         { pt: "Terminar",                 en: "Finish" },
  prev_btn:           { pt: "Anterior",                 en: "Previous" },
  next_btn:           { pt: "Próximo",                  en: "Next" },
  finish_workout_btn: { pt: "Concluir treino",          en: "Finish workout" },
  workout_done_title: { pt: "Treino concluído!",        en: "Workout done!" },
  see_demo:           { pt: "Ver demonstração",         en: "Watch demo" },
  feeling_heavy:      { pt: "Pesado",                   en: "Heavy" },
  feeling_ok:         { pt: "Ok",                       en: "Ok" },
  feeling_good:       { pt: "Bem",                      en: "Good" },
  feeling_top:        { pt: "Top",                      en: "Top" },
  weight_label:       { pt: "Peso (kg)",                en: "Weight (kg)" },
  reps_label:         { pt: "Reps",                     en: "Reps" },
  set_label:          { pt: "Série",                    en: "Set" },
  skip_rest:          { pt: "Saltar",                   en: "Skip" },
  screen_on:          { pt: "Ecrã ligado",              en: "Screen on" },
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
  } catch { /* ignore */ }
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

  const [step, setStep]       = useState(0);
  const [setLogs, setSetLogs] = useState<SetLog[][]>(
    sorted.map((ex) => Array.from({ length: ex.sets }, () => ({ weight: "", reps: String(ex.reps), done: false })))
  );
  const [restActive, setRestActive]   = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const [restLeft, setRestLeft]       = useState(0);
  const [feeling, setFeeling]   = useState("");
  const [note, setNote]         = useState("");
  const [finishing, setFinishing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const [prs, setPrs]           = useState<Set<string>>(new Set());
  const [prevLogs, setPrevLogs] = useState<Map<string, { topWeight: number; reps: number; date: string }>>(new Map());
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt   = useRef(Date.now());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const cur        = sorted[step];
  const totalSteps = sorted.length;
  // Overall progress = completed sets across all exercises
  const totalSets     = setLogs.reduce((s, ex) => s + ex.length, 0);
  const completedSets = setLogs.reduce((s, ex) => s + ex.filter((r) => r.done).length, 0);
  const progress      = totalSets > 0 ? completedSets / totalSets : 0;

  // ── Wake Lock — keeps screen on during workout ──────────────
  useEffect(() => {
    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener("release", () => setWakeLockActive(false));
      } catch { /* not granted */ }
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void requestWakeLock();
    };
    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // ── Elapsed timer ────────────────────────────────────────────
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  // ── Previous PRs + last session ─────────────────────────────
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const names = sorted.map((e) => e.name);
      const { data } = await supabase
        .from("workout_logs")
        .select("exercise_name, sets, logged_at")
        .eq("client_id", clientId)
        .in("exercise_name", names)
        .order("logged_at", { ascending: false })
        .limit(names.length * 3);
      if (!data) return;

      const best: Record<string, number> = {};
      const lastMap = new Map<string, { topWeight: number; reps: number; date: string }>();
      for (const log of data) {
        const sets = log.sets as { weight_kg?: number; reps?: number; done?: boolean }[];
        const done = sets.filter((s) => s.done !== false);
        const top  = done.reduce<{ weight_kg: number; reps: number } | null>((t, s) => {
          const w = s.weight_kg ?? 0;
          if (!t || w > t.weight_kg) return { weight_kg: w, reps: s.reps ?? 0 };
          return t;
        }, null);
        if (top && top.weight_kg > 0) {
          if (!best[log.exercise_name] || top.weight_kg > best[log.exercise_name]) best[log.exercise_name] = top.weight_kg;
          if (!lastMap.has(log.exercise_name)) lastMap.set(log.exercise_name, { topWeight: top.weight_kg, reps: top.reps, date: log.logged_at as string });
        }
      }
      setPrs(new Set(Object.keys(best)));
      setPrevLogs(lastMap);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rest timer ───────────────────────────────────────────────
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
        if (s === 4) beep(440, 0.1);
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

  // ── Mark set done ────────────────────────────────────────────
  function toggleSet(exIdx: number, setIdx: number) {
    setSetLogs((prev) => {
      const copy = prev.map((s) => s.map((r) => ({ ...r })));
      const wasNotDone = !copy[exIdx][setIdx].done;
      copy[exIdx][setIdx].done = !copy[exIdx][setIdx].done;
      if (wasNotDone) {
        const ex = sorted[exIdx];
        const group = (ex as Exercise & { superset_group?: string | null }).superset_group?.trim() || null;
        if (!group) startRest(restSeconds);
      }
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

  // ── Save and complete ────────────────────────────────────────
  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const today    = new Date();
    const logged_at = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    await Promise.all(
      sorted.map((ex, i) => {
        const sets = setLogs[i].map((s) => ({
          weight_kg: s.weight ? parseFloat(s.weight) : null,
          reps: parseInt(s.reps) || ex.reps,
          done: s.done,
        }));
        return supabase.from("workout_logs").upsert({
          client_id: clientId, exercise_name: ex.name, day_id: dayId, logged_at, sets,
        }, { onConflict: "client_id,exercise_name,day_id,logged_at" });
      })
    );
    await onComplete(feeling || "💪", note);
    setSaving(false);
  }

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const restPct = restLeft / restSeconds;

  function isPR(exIdx: number, setIdx: number) {
    const log = setLogs[exIdx][setIdx];
    const w = parseFloat(log.weight);
    return w > 0 && prs.has(sorted[exIdx].name);
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden select-none">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 pt-safe-top pt-5 pb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase">{dayLabel}</p>
          <p className="text-white font-black text-xl tabular-nums font-mono">{fmt(elapsed)}</p>
        </div>

        {/* Wake lock indicator */}
        <div className="w-9 flex flex-col items-center gap-0.5">
          {wakeLockActive && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
              <span className="text-[8px] text-brand-gold/60 leading-none">{extra.screen_on[lang]}</span>
            </>
          )}
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="h-0.5 bg-zinc-900 mx-5 rounded-full mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress * 100}%`, background: "linear-gradient(90deg,#E8C96B,#A8893A)" }}
        />
      </div>

      {/* ── REST OVERLAY ── */}
      {restActive && (
        <div className="absolute inset-0 z-20 bg-black/97 flex flex-col items-center justify-center gap-8">
          <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">{extra.rest_time[lang]}</p>

          {/* Circle */}
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#18181b" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke="#C9A84C" strokeWidth="6"
                strokeDasharray={`${276 * restPct} 276`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white text-6xl font-black tabular-nums font-mono">{restLeft}</span>
              <span className="text-zinc-500 text-xs mt-1">{extra.rest_remaining[lang]}</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => { setRestSeconds(s); startRest(s); }}
                className={`w-14 py-2 rounded-xl text-sm font-bold transition-all ${
                  restSeconds === s
                    ? "text-black"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}
                style={restSeconds === s ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)" } : {}}
              >
                {s}s
              </button>
            ))}
          </div>

          <button
            onClick={skipRest}
            className="px-8 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-sm font-semibold transition-all active:scale-95"
          >
            {extra.skip_rest[lang]} →
          </button>
        </div>
      )}

      {/* ── FINISHING SCREEN ── */}
      {finishing ? (
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div className="text-center">
            <p className="text-5xl mb-3">🏆</p>
            <h2 className="text-white text-2xl font-black">{extra.workout_done_title[lang]}</h2>
            <p className="text-brand-gold text-sm font-semibold mt-1">⏱ {fmt(elapsed)} {lang === "en" ? "of training" : "de treino"}</p>
          </div>

          <div>
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-3">{extra.how_was[lang]}</p>
            <div className="grid grid-cols-4 gap-2">
              {(["😓","😐","💪","🔥"] as const).map((emoji, i) => {
                const labels = [extra.feeling_heavy[lang], extra.feeling_ok[lang], extra.feeling_good[lang], extra.feeling_top[lang]];
                return (
                  <button
                    key={emoji}
                    onClick={() => setFeeling(emoji)}
                    className={`flex flex-col items-center py-3 rounded-2xl text-2xl transition-all active:scale-95 ${feeling === emoji ? "ring-2 ring-brand-gold" : "bg-zinc-900 border border-zinc-800"}`}
                    style={feeling === emoji ? { background: "rgba(201,168,76,0.12)" } : {}}
                  >
                    {emoji}
                    <span className="text-[10px] text-zinc-500 mt-1">{labels[i]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={extra.note_placeholder[lang]}
            rows={2}
            maxLength={200}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold/50 resize-none"
          />

          {/* Summary */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase px-4 py-3 border-b border-zinc-800/50">{extra.summary[lang]}</p>
            {sorted.map((ex, i) => {
              const done  = setLogs[i].filter((s) => s.done).length;
              const total = setLogs[i].length;
              const vol   = setLogs[i].filter((s) => s.done).reduce((sum, s) => sum + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0);
              return (
                <div key={ex.id} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/30 last:border-0">
                  <span className="text-white text-sm truncate max-w-[55%]">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${done === total ? "text-brand-gold" : "text-zinc-500"}`}>{extra.series_done[lang](done, total)}</span>
                    {vol > 0 && <span className="text-zinc-400 text-xs">{vol.toFixed(0)}kg</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            {saving ? extra.saving[lang] : extra.save_workout[lang]}
          </button>
        </div>

      ) : (
        <>
          {/* ── EXERCISE NAVIGATION PILLS ── */}
          <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto no-scrollbar">
            {sorted.map((ex, i) => {
              const done    = setLogs[i].filter((s) => s.done).length;
              const isActive = i === step;
              const isDone   = done === setLogs[i].length;
              return (
                <button
                  key={ex.id}
                  onClick={() => setStep(i)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    isActive
                      ? "text-black"
                      : isDone
                      ? "bg-zinc-900 text-brand-gold border border-brand-gold/30"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                  }`}
                  style={isActive ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)" } : {}}
                >
                  {isDone && !isActive ? "✓" : i + 1}
                </button>
              );
            })}
          </div>

          {/* ── CURRENT EXERCISE + SETS ── */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const renderExercise = (exIdx: number, ex: (typeof sorted)[0]) => {
                const logs  = setLogs[exIdx];
                const doneCt = logs.filter((s) => s.done).length;
                const prev  = prevLogs.get(ex.name);
                const daysAgo = prev ? Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000) : null;
                const group = (ex as Exercise & { superset_group?: string | null }).superset_group?.trim() || null;

                return (
                  <div key={ex.id} className="px-5 pb-2">
                    {/* Exercise header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h2 className="text-white text-2xl font-black leading-tight flex-1">{ex.name}</h2>
                        <span className="shrink-0 mt-1 text-zinc-500 text-sm tabular-nums">{doneCt}/{logs.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-gold text-sm font-semibold">{extra.sets_x_reps[lang](ex.sets, ex.reps)}</span>
                        {group && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">SS {group}</span>
                        )}
                      </div>
                      {prev && daysAgo !== null && (
                        <p className="text-zinc-600 text-xs mt-1">{extra.last_session[lang](prev.topWeight, prev.reps, daysAgo)}</p>
                      )}
                      {ex.notes && <p className="text-zinc-600 text-xs mt-1 italic">{ex.notes}</p>}
                      {ex.video_url && (
                        <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-brand-gold text-xs mt-1.5 hover:underline">
                          <span>▶</span> {extra.see_demo[lang]}
                        </a>
                      )}
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 px-1 mb-2">
                      <span className="text-zinc-600 text-[10px] font-semibold uppercase">#</span>
                      <span className="text-zinc-600 text-[10px] font-semibold uppercase">{extra.weight_label[lang]}</span>
                      <span className="text-zinc-600 text-[10px] font-semibold uppercase">{extra.reps_label[lang]}</span>
                      <span />
                    </div>

                    {/* Set rows */}
                    <div className="space-y-2">
                      {logs.map((s, si) => {
                        const pr = isPR(exIdx, si);
                        return (
                          <div
                            key={si}
                            className={`grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 items-center rounded-2xl px-3 py-2.5 transition-all ${
                              pr && s.done
                                ? "border border-yellow-500/40"
                                : s.done
                                ? "border border-brand-gold/20"
                                : "border border-zinc-800 bg-zinc-900/40"
                            }`}
                            style={s.done
                              ? pr
                                ? { background: "rgba(234,179,8,0.06)" }
                                : { background: "rgba(201,168,76,0.06)" }
                              : {}}
                          >
                            <span className={`text-xs font-bold text-center ${s.done ? "text-brand-gold" : "text-zinc-600"}`}>
                              {si + 1}
                            </span>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={s.weight}
                              onChange={(e) => updateLog(exIdx, si, "weight", e.target.value)}
                              placeholder="—"
                              className="bg-zinc-800 border border-zinc-700/50 rounded-xl px-2 py-2 text-white text-sm text-center w-full focus:outline-none focus:border-brand-gold/50"
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              value={s.reps}
                              onChange={(e) => updateLog(exIdx, si, "reps", e.target.value)}
                              className="bg-zinc-800 border border-zinc-700/50 rounded-xl px-2 py-2 text-white text-sm text-center w-full focus:outline-none focus:border-brand-gold/50"
                            />
                            <button
                              onClick={() => toggleSet(exIdx, si)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all active:scale-95 ${
                                s.done
                                  ? "text-black scale-105"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:border-brand-gold/50"
                              }`}
                              style={s.done ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)" } : {}}
                            >
                              ✓
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              };

              // Handle supersets: group consecutive same-group exercises
              const items: React.ReactNode[] = [];
              let i = 0;
              while (i < sorted.length) {
                const ex    = sorted[i];
                const group = (ex as Exercise & { superset_group?: string | null }).superset_group?.trim() || null;

                if (group) {
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
                  if (isGroupActive) {
                    // Show all exercises in the superset when any is active
                    items.push(
                      <div key={`ss-${group}`} className="pb-4">
                        <div className="mx-5 mb-3 flex items-center gap-2">
                          <div className="flex-1 h-px bg-orange-500/20" />
                          <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">{extra.superset_no_rest[lang]} {group}</span>
                          <div className="flex-1 h-px bg-orange-500/20" />
                        </div>
                        {groupItems.map(({ ex: gex, idx: gIdx }) => (
                          <div
                            key={gex.id}
                            className={`transition-opacity ${gIdx === step ? "opacity-100" : "opacity-40"}`}
                            onClick={() => gIdx !== step && setStep(gIdx)}
                          >
                            {renderExercise(gIdx, gex)}
                            {gIdx !== groupItems[groupItems.length - 1].idx && (
                              <div className="mx-5 my-2 h-px bg-orange-500/10" />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // Show collapsed pill for non-active superset
                    items.push(
                      <button
                        key={`ss-pill-${group}`}
                        onClick={() => setStep(groupItems[0].idx)}
                        className="w-full mx-5 mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-left"
                        style={{ width: "calc(100% - 40px)" }}
                      >
                        <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">SS {group}</span>
                        <span className="text-zinc-500 text-sm">{groupItems.map(g => g.ex.name).join(" + ")}</span>
                      </button>
                    );
                  }
                  i = j;
                } else {
                  items.push(
                    <div
                      key={ex.id}
                      className={`pb-4 transition-opacity cursor-default ${i === step ? "opacity-100" : "opacity-30 cursor-pointer"}`}
                      onClick={() => i !== step && setStep(i)}
                    >
                      {renderExercise(i, ex)}
                    </div>
                  );
                  i++;
                }
              }
              return items;
            })()}
          </div>

          {/* ── BOTTOM ACTIONS ── */}
          <div
            className="px-5 py-4 border-t space-y-3"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {/* Rest timer quick button */}
            {!restActive && (
              <button
                onClick={() => startRest(restSeconds)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-zinc-400 text-sm font-semibold transition-all active:scale-[0.98] border border-zinc-800 bg-zinc-900/50"
              >
                <span>⏱</span>
                <span>{fmt(restSeconds)} {extra.rest_time[lang].toLowerCase()}</span>
                <span className="text-zinc-700">·</span>
                {[30, 60, 90, 120].map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); setRestSeconds(s); }}
                    className={`text-[11px] px-1.5 py-0.5 rounded-md transition-colors ${restSeconds === s ? "text-brand-gold bg-brand-gold/10" : "text-zinc-600"}`}
                  >
                    {s}s
                  </button>
                ))}
              </button>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-5 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold transition-all active:scale-95"
                >
                  ← {extra.prev_btn[lang]}
                </button>
              )}
              {step < totalSteps - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "black" }}
                >
                  {extra.next_btn[lang]} →
                </button>
              ) : (
                <button
                  onClick={() => setFinishing(true)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "black" }}
                >
                  {extra.finish_workout_btn[lang]} 🏆
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
