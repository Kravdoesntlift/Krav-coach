"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/useLang";

type WorkoutType = "strength" | "cardio" | "sports" | "yoga" | "mobility" | "other";

interface ClientWorkout {
  id: string;
  date: string;
  title: string;
  type: WorkoutType | null;
  duration_min: number | null;
  calories: number | null;
  distance_km: number | null;
  notes: string | null;
  source: "manual" | "strava" | "apple_health" | "garmin";
  created_at: string;
}

const TYPE_LABELS: Record<WorkoutType, { pt: string; en: string; icon: string }> = {
  strength:  { pt: "Força",        en: "Strength",  icon: "🏋️" },
  cardio:    { pt: "Cardio",       en: "Cardio",    icon: "🏃" },
  sports:    { pt: "Desporto",     en: "Sports",    icon: "⚽" },
  yoga:      { pt: "Yoga",         en: "Yoga",      icon: "🧘" },
  mobility:  { pt: "Mobilidade",   en: "Mobility",  icon: "🤸" },
  other:     { pt: "Outro",        en: "Other",     icon: "💪" },
};

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  manual:        { label: "Manual",      color: "bg-zinc-700 text-zinc-300" },
  strava:        { label: "Strava",      color: "bg-orange-900/50 text-orange-400" },
  apple_health:  { label: "Apple Health",color: "bg-pink-900/50 text-pink-400" },
  garmin:        { label: "Garmin",      color: "bg-blue-900/50 text-blue-400" },
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
}

export default function MyWorkoutsPage() {
  const { lang } = useLang();
  const isEN = lang === "en";

  const [workouts, setWorkouts] = useState<ClientWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<WorkoutType>("strength");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/workouts");
    if (res.ok) {
      const data = await res.json() as { workouts: ClientWorkout[] };
      setWorkouts(data.workouts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        type,
        date,
        duration_min: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      }),
    });
    if (res.ok) {
      setTitle(""); setDuration(""); setNotes("");
      setDate(new Date().toISOString().slice(0, 10));
      setShowForm(false);
      await load();
    } else {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Erro ao guardar.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    setDeleting(null);
  }

  const cardStyle = {
    background: "linear-gradient(160deg, rgba(39,39,42,0.9) 0%, rgba(18,18,22,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.4)",
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isEN ? "My Workouts" : "Os meus treinos"}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {isEN ? "Log your own sessions" : "Regista as tuas próprias sessões"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-black"
          style={{ background: "linear-gradient(135deg, #C9A84C, #A8893A)" }}
        >
          {showForm ? (isEN ? "Cancel" : "Cancelar") : (isEN ? "+ Log workout" : "+ Registar")}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <h2 className="text-white font-bold">{isEN ? "New workout" : "Novo treino"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">{isEN ? "Title" : "Título"}</label>
              <input
                className="input" required
                placeholder={isEN ? "e.g. Chest & Triceps" : "ex. Peito e Tríceps"}
                value={title} onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isEN ? "Type" : "Tipo"}</label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value as WorkoutType)}>
                  {(Object.entries(TYPE_LABELS) as [WorkoutType, typeof TYPE_LABELS[WorkoutType]][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {isEN ? v.en : v.pt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{isEN ? "Date" : "Data"}</label>
                <input
                  type="date" className="input"
                  value={date} onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            <div>
              <label className="label">{isEN ? "Duration (minutes)" : "Duração (minutos)"}</label>
              <input
                type="number" className="input" min={1} max={600}
                placeholder="60"
                value={duration} onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div>
              <label className="label">{isEN ? "Notes (optional)" : "Notas (opcional)"}</label>
              <textarea
                className="input resize-none" rows={2}
                placeholder={isEN ? "How did it go?" : "Como correu?"}
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit" disabled={saving || !title.trim()}
              className="btn-primary w-full py-2.5 rounded-xl text-sm"
            >
              {saving ? (isEN ? "Saving..." : "A guardar...") : (isEN ? "Save workout" : "Guardar treino")}
            </button>
          </form>
        </div>
      )}

      {/* Workout list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={cardStyle}>
          <p className="text-4xl mb-3">💪</p>
          <p className="text-white font-semibold">
            {isEN ? "No workouts yet" : "Ainda sem treinos registados"}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            {isEN
              ? "Log your first session or connect Strava to import automatically"
              : "Regista a tua primeira sessão ou liga o Strava para importar automaticamente"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {workouts.map((w) => {
            const typeInfo = w.type ? TYPE_LABELS[w.type] : null;
            const srcInfo = SOURCE_BADGE[w.source] ?? SOURCE_BADGE.manual;
            return (
              <div key={w.id} className="rounded-2xl p-4" style={cardStyle}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeInfo && (
                        <span className="text-sm">{typeInfo.icon}</span>
                      )}
                      <span className="text-white font-semibold text-sm truncate">{w.title}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${srcInfo.color}`}>
                        {srcInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-zinc-500 text-xs">
                      <span>{formatDate(w.date)}</span>
                      {w.duration_min && <span>⏱ {w.duration_min} min</span>}
                      {w.calories && <span>🔥 {w.calories} kcal</span>}
                      {w.distance_km && <span>📍 {w.distance_km} km</span>}
                    </div>
                    {w.notes && (
                      <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed line-clamp-2">{w.notes}</p>
                    )}
                  </div>
                  {w.source === "manual" && (
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deleting === w.id}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-lg shrink-0 leading-none"
                      title={isEN ? "Delete" : "Apagar"}
                    >
                      {deleting === w.id ? "..." : "×"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strava tip */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
        <span className="text-brand-gold text-lg shrink-0">⚡</span>
        <p className="text-zinc-400 text-xs leading-relaxed">
          {isEN
            ? "Connect Strava in Integrations to import your runs, rides and gym sessions automatically."
            : "Liga o Strava nas Integrações para importar os teus treinos automaticamente."}
          {" "}
          <a href="/client/integrations" className="text-brand-gold hover:underline">
            {isEN ? "Go to integrations →" : "Integrações →"}
          </a>
        </p>
      </div>
    </div>
  );
}
