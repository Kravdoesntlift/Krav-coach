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

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DailyLogPage() {
  const supabase = createClient();

  const today = toLocalDateString(new Date());

  const [userId, setUserId] = useState<string | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const cutoff = toLocalDateString(new Date(Date.now() - 13 * 86400000));

      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("client_id", user.id)
        .gte("logged_at", cutoff)
        .order("logged_at", { ascending: false });

      const logs = (data ?? []) as DailyLog[];
      const tlog = logs.find((l) => l.logged_at === today) ?? null;
      setTodayLog(tlog);
      setRecentLogs(logs);

      if (tlog) {
        setEnergy(tlog.energy);
        setNote(tlog.note ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const isEditMode = editing || !todayLog;

  async function handleSave() {
    if (!energy || !userId) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("daily_logs")
      .upsert(
        { client_id: userId, logged_at: today, energy, note: note.trim() || null },
        { onConflict: "client_id,logged_at" }
      )
      .select()
      .single();

    if (!error && data) {
      setTodayLog(data as DailyLog);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // refresh recent list
      setRecentLogs((prev) => {
        const filtered = prev.filter((l) => l.logged_at !== today);
        return [data as DailyLog, ...filtered].sort((a, b) =>
          b.logged_at.localeCompare(a.logged_at)
        );
      });
    }
    setSaving(false);
  }

  // Build last-7-days strip (today first, going back)
  const last7: { date: string; log: DailyLog | null }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = toLocalDateString(new Date(Date.now() - i * 86400000));
    last7.push({ date: d, log: recentLogs.find((l) => l.logged_at === d) ?? null });
  }

  const todayLabel = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) return null;

  return (
    <div className="space-y-6 page-enter pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Registo Diário</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{todayLabel}</p>
      </div>

      {/* Already logged & not editing */}
      {todayLog && !editing ? (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Registo de hoje</p>
            <button
              onClick={() => setEditing(true)}
              className="text-brand-gold text-sm font-semibold hover:underline"
            >
              Editar
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl">
              {ENERGY_OPTIONS.find((e) => e.value === todayLog.energy)?.emoji}
            </span>
            <div>
              <p className="text-white font-semibold text-lg">
                {ENERGY_OPTIONS.find((e) => e.value === todayLog.energy)?.label}
              </p>
              <p className="text-gray-500 text-xs">Energia: {todayLog.energy}/5</p>
            </div>
          </div>
          {todayLog.note && (
            <p className="text-gray-300 text-sm bg-zinc-800 rounded-xl px-4 py-3 leading-relaxed">
              {todayLog.note}
            </p>
          )}
          {saved && (
            <p className="text-green-400 text-sm font-semibold text-center">
              Guardado ✓
            </p>
          )}
        </div>
      ) : (
        /* Log form */
        <div className="card p-5 space-y-5">
          <p className="text-gray-400 text-sm">
            {todayLog ? "Editar registo de hoje" : "Como te sentes hoje?"}
          </p>

          {/* Energy selector */}
          <div className="flex gap-2 justify-between">
            {ENERGY_OPTIONS.map((opt) => {
              const selected = energy === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setEnergy(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150 ${
                    selected
                      ? "ring-2 ring-brand-gold scale-110 bg-zinc-800"
                      : "bg-zinc-800/50 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-3xl leading-none">{opt.emoji}</span>
                  <span
                    className={`text-[10px] font-semibold leading-tight text-center ${
                      selected ? "text-brand-gold" : "text-gray-500"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Note */}
          <div className="space-y-1">
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
        <div className="flex gap-2">
          {last7.map(({ date, log }) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === today;
            const dayLabel = d.toLocaleDateString("pt-PT", { weekday: "short" });
            const dayNum = d.getDate();
            const emoji = log
              ? ENERGY_OPTIONS.find((e) => e.value === log.energy)?.emoji ?? "—"
              : "—";

            return (
              <div
                key={date}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl ${
                  isToday ? "bg-zinc-800 ring-1 ring-zinc-600" : "bg-zinc-900"
                }`}
              >
                <span className="text-gray-500 text-[10px] uppercase leading-none">
                  {dayLabel}
                </span>
                <span className="text-gray-400 text-xs font-semibold">{dayNum}</span>
                <span className="text-xl leading-none">{log ? emoji : <span className="text-gray-700 text-sm">—</span>}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
