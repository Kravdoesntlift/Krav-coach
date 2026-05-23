"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ENERGY_OPTIONS = [
  { value: 1, emoji: "😴", label: "Esgotado" },
  { value: 2, emoji: "😓", label: "Cansado" },
  { value: 3, emoji: "😐", label: "Normal" },
  { value: 4, emoji: "😊", label: "Bem" },
  { value: 5, emoji: "🔥", label: "Excelente" },
] as const;

interface DailyLog {
  id: string;
  client_id: string;
  logged_at: string;
  energy: number;
  note: string | null;
}

interface HealthLog {
  id: string;
  client_id: string;
  log_date: string;
  steps: number;
  water_ml: number;
}

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const GLASS_ML = 250;
const GOAL_GLASSES = 8;
const GOAL_STEPS = 10000;

function StepsInput({ steps, onChange }: { steps: number; onChange: (v: number) => void }) {
  const pct = Math.min((steps / GOAL_STEPS) * 100, 100);
  const color = steps >= GOAL_STEPS ? "#22c55e" : steps >= 7000 ? "#C9A84C" : "#71717a";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Passos hoje</label>
        <span className={`text-sm font-bold ${steps >= GOAL_STEPS ? "text-green-400" : "text-brand-gold"}`}>
          {steps >= GOAL_STEPS ? "Meta atingida! 🎉" : `${(GOAL_STEPS - steps).toLocaleString()} para a meta`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      {/* Step counter */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={99999}
          value={steps}
          onChange={(e) => onChange(Math.max(0, Math.min(99999, parseInt(e.target.value) || 0)))}
          className="input flex-1 text-center text-xl font-bold tabular-nums"
        />
        <span className="text-gray-500 text-sm">passos</span>
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {[1000, 2500, 5000, 10000].map((n) => (
          <button
            key={n}
            onClick={() => onChange(Math.min(99999, steps + n))}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-gray-300 transition-colors"
          >
            +{n >= 1000 ? `${n / 1000}k` : n}
          </button>
        ))}
      </div>
    </div>
  );
}

function WaterTracker({ glasses, onChange }: { glasses: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Água</label>
        <span className={`text-sm font-bold ${glasses >= GOAL_GLASSES ? "text-green-400" : "text-brand-gold"}`}>
          {glasses * GLASS_ML} ml / {GOAL_GLASSES * GLASS_ML} ml
        </span>
      </div>

      {/* Glasses grid */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: GOAL_GLASSES }).map((_, i) => {
          const filled = i < glasses;
          return (
            <button
              key={i}
              onClick={() => onChange(filled && i === glasses - 1 ? glasses - 1 : i + 1)}
              className={`flex-1 min-w-[calc(12.5%-8px)] aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 border ${
                filled
                  ? "bg-blue-500/20 border-blue-400/40 text-blue-400"
                  : "bg-zinc-800/50 border-zinc-700/50 text-zinc-700"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                <path d="M8 12h8M12 8v8" strokeLinecap="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Extra glasses if over 8 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, glasses - 1))}
          disabled={glasses === 0}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-black text-white">{glasses}</span>
          <span className="text-gray-500 text-sm"> / {GOAL_GLASSES} copos</span>
        </div>
        <button
          onClick={() => onChange(glasses + 1)}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function DailyLogPage() {
  const supabase = createClient();
  const today = toLocalDateString(new Date());

  const [userId, setUserId] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [healthLog, setHealthLog] = useState<HealthLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [recentHealth, setRecentHealth] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [steps, setSteps] = useState(0);
  const [glasses, setGlasses] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const cutoff = toLocalDateString(new Date(Date.now() - 13 * 86400000));

      const [{ data: logs }, { data: health }] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("*")
          .eq("client_id", user.id)
          .gte("logged_at", cutoff)
          .order("logged_at", { ascending: false }),
        supabase
          .from("daily_health_logs")
          .select("*")
          .eq("client_id", user.id)
          .gte("log_date", cutoff)
          .order("log_date", { ascending: false }),
      ]);

      const allLogs = (logs ?? []) as DailyLog[];
      const allHealth = (health ?? []) as HealthLog[];

      const tlog = allLogs.find((l) => l.logged_at === today) ?? null;
      const thealth = allHealth.find((h) => h.log_date === today) ?? null;

      setTodayLog(tlog);
      setHealthLog(thealth);
      setRecentLogs(allLogs);
      setRecentHealth(allHealth);

      if (tlog) { setEnergy(tlog.energy); setNote(tlog.note ?? ""); }
      if (thealth) { setSteps(thealth.steps); setGlasses(Math.round(thealth.water_ml / GLASS_ML)); }

      setLoading(false);
    }
    load();
  }, []);

  const isEditMode = editing || !todayLog;

  async function handleSave() {
    if (!energy || !userId) return;
    setSaving(true);

    await Promise.all([
      supabase
        .from("daily_logs")
        .upsert(
          { client_id: userId, logged_at: today, energy, note: note.trim() || null },
          { onConflict: "client_id,logged_at" }
        )
        .select()
        .single(),
      supabase
        .from("daily_health_logs")
        .upsert(
          { client_id: userId, log_date: today, steps, water_ml: glasses * GLASS_ML },
          { onConflict: "client_id,log_date" }
        )
        .select()
        .single(),
    ]).then(([{ data: logData }, { data: healthData }]) => {
      if (logData) setTodayLog(logData as DailyLog);
      if (healthData) setHealthLog(healthData as HealthLog);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });

    setSaving(false);
  }

  const last7: { date: string; log: DailyLog | null; health: HealthLog | null }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = toLocalDateString(new Date(Date.now() - i * 86400000));
    last7.push({
      date: d,
      log: recentLogs.find((l) => l.logged_at === d) ?? null,
      health: recentHealth.find((h) => h.log_date === d) ?? null,
    });
  }

  const todayLabel = new Date().toLocaleDateString("pt-PT", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (loading) return null;

  return (
    <div className="space-y-6 page-enter pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Registo Diário</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{todayLabel}</p>
      </div>

      {/* Summary view (already saved & not editing) */}
      {todayLog && !editing ? (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Registo de hoje</p>
            <button onClick={() => setEditing(true)} className="text-brand-gold text-sm font-semibold hover:underline">
              Editar
            </button>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-4">
            <span className="text-5xl">{ENERGY_OPTIONS.find((e) => e.value === todayLog.energy)?.emoji}</span>
            <div>
              <p className="text-white font-semibold text-lg">{ENERGY_OPTIONS.find((e) => e.value === todayLog.energy)?.label}</p>
              <p className="text-gray-500 text-xs">Energia: {todayLog.energy}/5</p>
            </div>
          </div>

          {/* Steps + Water summary */}
          {healthLog && (
            <div className="flex gap-3">
              <div className="flex-1 bg-zinc-800/60 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{healthLog.steps.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-0.5">passos</p>
                {healthLog.steps >= GOAL_STEPS && <p className="text-green-400 text-[10px] font-bold mt-1">META ✓</p>}
              </div>
              <div className="flex-1 bg-zinc-800/60 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white">{healthLog.water_ml >= 1000 ? `${(healthLog.water_ml / 1000).toFixed(1)}L` : `${healthLog.water_ml}ml`}</p>
                <p className="text-gray-500 text-xs mt-0.5">água</p>
                {healthLog.water_ml >= GOAL_GLASSES * GLASS_ML && <p className="text-blue-400 text-[10px] font-bold mt-1">META ✓</p>}
              </div>
            </div>
          )}

          {todayLog.note && (
            <p className="text-gray-300 text-sm bg-zinc-800 rounded-xl px-4 py-3 leading-relaxed">{todayLog.note}</p>
          )}
          {saved && <p className="text-green-400 text-sm font-semibold text-center">Guardado ✓</p>}
        </div>
      ) : (
        /* Edit / Create form */
        <div className="space-y-4">
          {/* Energy */}
          <div className="card p-5 space-y-4">
            <p className="text-gray-400 text-sm font-semibold">Como te sentes hoje?</p>
            <div className="flex gap-2 justify-between">
              {ENERGY_OPTIONS.map((opt) => {
                const selected = energy === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setEnergy(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150 ${
                      selected ? "ring-2 ring-brand-gold scale-110 bg-zinc-800" : "bg-zinc-800/50 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-3xl leading-none">{opt.emoji}</span>
                    <span className={`text-[10px] font-semibold leading-tight text-center ${selected ? "text-brand-gold" : "text-gray-500"}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div className="card p-5">
            <StepsInput steps={steps} onChange={setSteps} />
          </div>

          {/* Water */}
          <div className="card p-5">
            <WaterTracker glasses={glasses} onChange={setGlasses} />
          </div>

          {/* Note */}
          <div className="card p-5 space-y-2">
            <label className="label">Nota (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Como foi o teu dia? Alguma dor, stresse ou conquista?"
              rows={3}
              className="input w-full resize-none"
            />
            <p className="text-gray-600 text-xs text-right">{note.length}/200</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setEnergy(todayLog?.energy ?? null);
                  setNote(todayLog?.note ?? "");
                  setSteps(healthLog?.steps ?? 0);
                  setGlasses(healthLog ? Math.round(healthLog.water_ml / GLASS_ML) : 0);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!energy || saving}
              className="flex-1 btn-primary py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "A guardar…" : saved ? "Guardado ✓" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Last 7 days strip */}
      <div className="space-y-3">
        <p className="text-gray-400 text-sm font-semibold">Últimos 7 dias</p>
        <div className="flex gap-1.5">
          {last7.map(({ date, log, health }) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === today;
            const dayLabel = d.toLocaleDateString("pt-PT", { weekday: "short" });
            const dayNum = d.getDate();
            const emoji = log ? ENERGY_OPTIONS.find((e) => e.value === log.energy)?.emoji ?? "—" : null;

            return (
              <div
                key={date}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl ${
                  isToday ? "bg-zinc-800 ring-1 ring-zinc-600" : "bg-zinc-900"
                }`}
              >
                <span className="text-gray-500 text-[9px] uppercase leading-none">{dayLabel}</span>
                <span className="text-gray-400 text-[11px] font-semibold">{dayNum}</span>
                <span className="text-lg leading-none">{emoji ?? <span className="text-gray-700 text-xs">—</span>}</span>
                {health && health.steps >= GOAL_STEPS && (
                  <span className="text-[8px] text-green-400 font-bold leading-none">10k</span>
                )}
                {health && health.water_ml >= GOAL_GLASSES * GLASS_ML && (
                  <span className="text-[8px] text-blue-400 font-bold leading-none">💧</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
