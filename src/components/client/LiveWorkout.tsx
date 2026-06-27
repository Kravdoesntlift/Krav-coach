"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Exercise } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n/useLang";

function beep(freq = 880, vol = 0.35) {
  try {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new C(); const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq; g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
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

interface SetLog { weight: string; reps: string; done: boolean; }

export default function LiveWorkout({ exercises, dayId, clientId, dayLabel, onComplete, onClose }: Props) {
  const { lang } = useLang();
  const isEN = lang === "en";
  const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);

  const [step, setStep]           = useState(0);
  const [setLogs, setSetLogs]     = useState<SetLog[][]>(
    sorted.map((ex) => Array.from({ length: ex.sets }, () => ({ weight: "", reps: String(ex.reps ?? ""), done: false })))
  );
  const [restActive, setRestActive] = useState(false);
  const [restDur, setRestDur]       = useState(90);
  const [restLeft, setRestLeft]     = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const [finishing, setFinishing]   = useState(false);
  const [feeling, setFeeling]       = useState("");
  const [note, setNote]             = useState("");
  const [saving, setSaving]         = useState(false);
  const [wakeLock, setWakeLock]     = useState(false);
  const [prevLogs, setPrevLogs]     = useState<Map<string, { topWeight: number; reps: number; date: string }>>(new Map());

  const restRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wlRef      = useRef<WakeLockSentinel | null>(null);
  const audioRef   = useRef<{ ctx: AudioContext; osc: OscillatorNode } | null>(null);
  const startedAt  = useRef(Date.now());

  const cur        = sorted[step];
  const totalSteps = sorted.length;
  const curLogs    = setLogs[step] ?? [];
  const totalSets     = setLogs.reduce((s, e) => s + e.length, 0);
  const completedSets = setLogs.reduce((s, e) => s + e.filter((r) => r.done).length, 0);
  const progress      = totalSets > 0 ? completedSets / totalSets : 0;
  const prev          = prevLogs.get(cur?.name ?? "");
  const daysAgo       = prev ? Math.round((Date.now() - new Date(prev.date).getTime()) / 86400000) : null;

  // ── Wake Lock ──────────────────────────────────────────────
  useEffect(() => {
    async function reqWL() {
      if (!("wakeLock" in navigator)) return;
      try { wlRef.current = await navigator.wakeLock.request("screen"); setWakeLock(true);
        wlRef.current.addEventListener("release", () => setWakeLock(false)); } catch { /* ignore */ }
    }
    const onVis = () => { if (document.visibilityState === "visible") void reqWL(); };
    void reqWL();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); wlRef.current?.release().catch(() => {}); };
  }, []);

  // ── Silent audio — keeps Media Session alive on lock screen ─
  useEffect(() => {
    try {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new C();
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      g.gain.value = 0.0001; // inaudible
      osc.connect(g); g.connect(ctx.destination);
      osc.start();
      audioRef.current = { ctx, osc };
    } catch { /* ignore */ }
    return () => { try { audioRef.current?.osc.stop(); audioRef.current?.ctx.close(); } catch { /* ignore */ } };
  }, []);

  // ── Elapsed timer ─────────────────────────────────────────
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  // ── Media Session + local notification ────────────────────
  useEffect(() => {
    if (finishing) return;
    const ex = sorted[step];
    const doneSets = setLogs[step]?.filter((s) => s.done).length ?? 0;
    const setLabel = `${isEN ? "Set" : "Série"} ${doneSets + 1}/${ex?.sets ?? 0}`;

    try {
      if ("mediaSession" in navigator && "MediaMetadata" in window) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: ex?.name ?? dayLabel, artist: `KRAV · ${setLabel}`, album: dayLabel,
          artwork: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }],
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => setStep((s) => Math.max(0, s - 1)));
        navigator.mediaSession.setActionHandler("nexttrack", () => setStep((s) => Math.min(totalSteps - 1, s + 1)));
        navigator.mediaSession.playbackState = "playing";
      }
    } catch { /* unsupported */ }

    try {
      if (Notification.permission === "granted") {
        new Notification(`${ex?.name ?? dayLabel}`, {
          body: `${setLabel} · KRAV Coach`, icon: "/icon.png",
          tag: "krav-workout", silent: true,
        });
      }
    } catch { /* unsupported */ }
  }, [step, setLogs, sorted, dayLabel, isEN, totalSteps, finishing]);

  // ── Previous session data ─────────────────────────────────
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const names = sorted.map((e) => e.name);
      const { data } = await supabase.from("workout_logs").select("exercise_name, sets, logged_at")
        .eq("client_id", clientId).in("exercise_name", names)
        .order("logged_at", { ascending: false }).limit(names.length * 3);
      if (!data) return;
      const map = new Map<string, { topWeight: number; reps: number; date: string }>();
      for (const log of data) {
        const sets = log.sets as { weight_kg?: number; reps?: number; done?: boolean }[];
        const top  = sets.filter((s) => s.done !== false).reduce<{ weight_kg: number; reps: number } | null>((t, s) => {
          const w = s.weight_kg ?? 0; return !t || w > t.weight_kg ? { weight_kg: w, reps: s.reps ?? 0 } : t;
        }, null);
        if (top && top.weight_kg > 0 && !map.has(log.exercise_name))
          map.set(log.exercise_name, { topWeight: top.weight_kg, reps: top.reps, date: log.logged_at as string });
      }
      setPrevLogs(map);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Rest timer ────────────────────────────────────────────
  const startRest = useCallback((seconds: number) => {
    setRestLeft(seconds); setRestActive(true);
  }, []);

  useEffect(() => {
    if (!restActive) return;
    restRef.current = setInterval(() => {
      setRestLeft((s) => {
        if (s <= 1) {
          clearInterval(restRef.current!); setRestActive(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          beep(880); setTimeout(() => beep(1100), 200);
          return 0;
        }
        if (s === 4) beep(440, 0.08);
        return s - 1;
      });
    }, 1000);
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [restActive]);

  function skipRest() { if (restRef.current) clearInterval(restRef.current); setRestActive(false); }

  function toggleSet(exIdx: number, si: number) {
    setSetLogs((prev) => {
      const copy = prev.map((s) => s.map((r) => ({ ...r })));
      const wasDone = copy[exIdx][si].done;
      copy[exIdx][si].done = !wasDone;
      if (!wasDone) {
        const group = (sorted[exIdx] as Exercise & { superset_group?: string | null }).superset_group?.trim();
        if (!group) startRest(restDur);
      }
      return copy;
    });
  }

  function updateLog(exIdx: number, si: number, field: "weight" | "reps", val: string) {
    setSetLogs((prev) => { const c = prev.map((s) => s.map((r) => ({ ...r }))); c[exIdx][si][field] = val; return c; });
  }

  async function handleFinish() {
    setSaving(true);
    const supabase = createClient();
    const today    = new Date();
    const logged_at = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    // Save exercise logs
    await Promise.all(
      sorted.map((ex, i) =>
        supabase.from("workout_logs").upsert({
          client_id: clientId, exercise_name: ex.name, day_id: dayId, logged_at,
          sets: setLogs[i].map((s) => ({ weight_kg: s.weight ? parseFloat(s.weight) : null, reps: parseInt(s.reps) || ex.reps, done: s.done })),
        }, { onConflict: "client_id,exercise_name,day_id,logged_at" })
      )
    );

    // Mark workout as complete in DB
    await supabase.from("workout_completions")
      .upsert({ client_id: clientId, day_id: dayId }, { onConflict: "client_id,day_id" });

    // Clear workout notification
    try { new Notification("KRAV · Treino concluído 🏆", { body: `${dayLabel}`, icon: "/icon.png", tag: "krav-workout", silent: true }); } catch { /* ignore */ }

    await onComplete(feeling || "💪", note);
    setSaving(false);
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const restPct = restLeft / restDur;

  // ─────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      {/* ── REST OVERLAY ── */}
      {restActive && (
        <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center gap-6">
          <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase">
            {isEN ? "Rest" : "Descanso"}
          </p>
          <div className="relative" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r="88" fill="none" stroke="#18181b" strokeWidth="8" />
              <circle cx="100" cy="100" r="88" fill="none" stroke="#C9A84C" strokeWidth="8"
                strokeDasharray={`${553 * restPct} 553`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s linear" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black tabular-nums" style={{ fontSize: 72, lineHeight: 1 }}>{restLeft}</span>
              <span className="text-zinc-500 text-xs mt-1">{isEN ? "seconds" : "segundos"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((s) => (
              <button key={s} onClick={() => { setRestDur(s); setRestLeft(s); }}
                className="rounded-2xl text-sm font-bold transition-all active:scale-95"
                style={{ width: 56, paddingTop: 10, paddingBottom: 10,
                  ...(restDur === s
                    ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }
                    : { background: "#18181b", color: "#52525b", border: "1px solid #27272a" }) }}
              >{s}s</button>
            ))}
          </div>
          <button onClick={skipRest}
            className="px-8 rounded-2xl border border-zinc-800 bg-zinc-900 text-white text-sm font-semibold active:scale-95"
            style={{ paddingTop: 12, paddingBottom: 12 }}>
            {isEN ? "Skip →" : "Saltar →"}
          </button>
        </div>
      )}

      {/* ── FINISH SCREEN ── */}
      {finishing && (
        <div className="absolute inset-0 z-30 bg-black overflow-y-auto flex flex-col gap-5"
          style={{ padding: "max(1.5rem, env(safe-area-inset-top,0px)) 1.25rem max(1.5rem, env(safe-area-inset-bottom,0px))" }}>
          <div className="text-center pt-2">
            <p className="text-5xl mb-3">🏆</p>
            <h2 className="text-white text-2xl font-black">{isEN ? "Workout done!" : "Treino concluído!"}</h2>
            <p className="text-brand-gold text-sm font-semibold mt-1">⏱ {fmt(elapsed)} {isEN ? "of training" : "de treino"}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-3">{isEN ? "How did it go?" : "Como correu?"}</p>
            <div className="grid grid-cols-4 gap-2">
              {(["😓","😐","💪","🔥"] as const).map((emoji, i) => {
                const labels = isEN ? ["Heavy","Ok","Good","Top"] : ["Pesado","Ok","Bem","Top"];
                return (
                  <button key={emoji} onClick={() => setFeeling(emoji)}
                    className={`flex flex-col items-center py-3 rounded-2xl text-2xl transition-all active:scale-95 border ${feeling===emoji?"border-brand-gold":"border-zinc-800 bg-zinc-900"}`}
                    style={feeling===emoji?{background:"rgba(201,168,76,0.1)"}:{}}>
                    {emoji}<span className="text-[10px] text-zinc-500 mt-1">{labels[i]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={isEN ? "Optional note..." : "Nota opcional..."} rows={2} maxLength={200}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold/50 resize-none" />
          <div className="rounded-2xl overflow-hidden border border-zinc-800">
            <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase px-4 py-2.5 border-b border-zinc-800">
              {isEN ? "Summary" : "Resumo"}
            </p>
            {sorted.map((ex, i) => {
              const done  = setLogs[i].filter((s) => s.done).length;
              const total = setLogs[i].length;
              const vol   = setLogs[i].filter((s) => s.done).reduce((sum, s) => sum+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0), 0);
              return (
                <div key={ex.id} className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/40 last:border-0">
                  <span className="text-white text-sm truncate max-w-[55%]">{ex.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${done===total?"text-brand-gold":"text-zinc-500"}`}>{done}/{total}</span>
                    {vol > 0 && <span className="text-zinc-400 text-xs">{vol.toFixed(0)}kg</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleFinish} disabled={saving}
            className="w-full rounded-2xl font-black text-black text-base transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ paddingTop: 16, paddingBottom: 16, background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
            {saving ? (isEN ? "Saving..." : "A guardar...") : (isEN ? "Save workout" : "Guardar treino")}
          </button>
        </div>
      )}

      {/* ── HEADER (shrink-0) ── */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3">
        <button onClick={onClose}
          className="shrink-0 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 active:scale-90">
          ✕
        </button>
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {sorted.map((_, i) => {
            const done   = setLogs[i]?.every((s) => s.done);
            const active = i === step;
            return (
              <button key={i} onClick={() => setStep(i)}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black active:scale-90"
                style={active
                  ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }
                  : done
                  ? { background: "rgba(201,168,76,0.12)", color: "#C9A84C" }
                  : { background: "#18181b", color: "#52525b" }}>
                {done && !active ? "✓" : i + 1}
              </button>
            );
          })}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-white font-black tabular-nums text-lg leading-tight">{fmt(elapsed)}</div>
          {wakeLock && (
            <div className="flex items-center justify-end gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" style={{ boxShadow: "0 0 4px #C9A84C" }} />
              <span className="text-[9px] text-brand-gold/60">{isEN ? "screen on" : "ecrã ativo"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PROGRESS BAR (shrink-0) ── */}
      <div className="shrink-0 mx-4 mb-4" style={{ height: 1, background: "#18181b" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg,#E8C96B,#A8893A)", transition: "width .5s" }} />
      </div>

      {/* ── EXERCISE INFO (shrink-0) ── */}
      <div className="shrink-0 px-4 mb-3">
        <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-widest mb-1">
          {isEN ? `Exercise ${step+1} of ${totalSteps}` : `Exercício ${step+1} de ${totalSteps}`}
        </p>
        <h2 className="text-white font-black leading-tight" style={{ fontSize: "clamp(1.35rem,5.5vw,1.9rem)" }}>
          {cur?.name}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
          <span className="text-brand-gold text-sm font-semibold">{cur?.sets} × {cur?.reps} reps</span>
          {prev && daysAgo !== null && (
            <span className="text-zinc-600 text-xs">
              {isEN ? `Last: ${prev.topWeight}kg × ${prev.reps} (${daysAgo}d)` : `Última: ${prev.topWeight}kg × ${prev.reps} (${daysAgo}d)`}
            </span>
          )}
        </div>
        {cur?.notes && <p className="text-zinc-600 text-xs mt-0.5 italic">{cur.notes}</p>}
      </div>

      {/* ── COLUMN HEADERS (shrink-0) ── */}
      <div className="shrink-0 px-5 mb-2"
        style={{ display: "grid", gridTemplateColumns: "1.5rem 1fr 1fr 2.5rem", gap: "0.5rem" }}>
        <span className="text-zinc-700 text-[10px] font-semibold uppercase">#</span>
        <span className="text-zinc-700 text-[10px] font-semibold uppercase">{isEN ? "Weight kg" : "Peso kg"}</span>
        <span className="text-zinc-700 text-[10px] font-semibold uppercase">Reps</span>
        <span />
      </div>

      {/* ── SET ROWS (flex-1, scrolls only if many sets) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3" style={{ gap: "0.375rem", display: "flex", flexDirection: "column" }}>
        {curLogs.map((s, si) => (
          <div key={si}
            style={{
              display: "grid", gridTemplateColumns: "1.5rem 1fr 1fr 2.5rem", gap: "0.5rem",
              alignItems: "center", borderRadius: 16, padding: "0.375rem 0.5rem", flexShrink: 0,
              background: s.done ? "rgba(201,168,76,0.07)" : "rgba(255,255,255,0.02)",
              border:     s.done ? "1px solid rgba(201,168,76,0.2)" : "1px solid rgba(255,255,255,0.05)",
            }}>
            <span className="text-xs font-black text-center" style={{ color: s.done ? "#C9A84C" : "#52525b" }}>
              {si + 1}
            </span>
            <input type="number" inputMode="decimal" placeholder="—" value={s.weight}
              onChange={(e) => updateLog(step, si, "weight", e.target.value)}
              className="bg-zinc-800 border border-zinc-700/40 rounded-xl text-white text-sm text-center w-full focus:outline-none focus:border-brand-gold/40"
              style={{ padding: "0.5rem 0.25rem" }} />
            <input type="number" inputMode="numeric" value={s.reps}
              onChange={(e) => updateLog(step, si, "reps", e.target.value)}
              className="bg-zinc-800 border border-zinc-700/40 rounded-xl text-white text-sm text-center w-full focus:outline-none focus:border-brand-gold/40"
              style={{ padding: "0.5rem 0.25rem" }} />
            <button onClick={() => toggleSet(step, si)}
              className="flex items-center justify-center text-sm font-black rounded-full transition-all active:scale-90"
              style={{ width: 40, height: 40, flexShrink: 0,
                ...(s.done
                  ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }
                  : { background: "#27272a", color: "#52525b" }) }}>
              ✓
            </button>
          </div>
        ))}
      </div>

      {/* ── BOTTOM (shrink-0) ── */}
      <div className="shrink-0 px-4 pt-3 pb-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Rest presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-600 text-xs shrink-0">⏱</span>
          {[30, 60, 90, 120].map((s) => (
            <button key={s} onClick={() => { setRestDur(s); startRest(s); }}
              className="flex-1 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ paddingTop: 8, paddingBottom: 8,
                ...(restDur === s
                  ? { background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }
                  : { background: "#18181b", color: "#52525b", border: "1px solid #27272a" }) }}>
              {s}s
            </button>
          ))}
        </div>
        {/* Nav */}
        <div className="flex gap-2">
          <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
            className="rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-20"
            style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14, background: "#18181b", color: "#a1a1aa", border: "1px solid #27272a" }}>
            ← {isEN ? "Prev" : "Ant"}
          </button>
          {step < totalSteps - 1 ? (
            <button onClick={() => setStep((s) => s + 1)}
              className="flex-1 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
              style={{ paddingTop: 14, paddingBottom: 14, background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }}>
              {isEN ? "Next →" : "Próximo →"}
            </button>
          ) : (
            <button onClick={() => setFinishing(true)}
              className="flex-1 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
              style={{ paddingTop: 14, paddingBottom: 14, background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }}>
              {isEN ? "Finish 🏆" : "Terminar 🏆"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
