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
}

const TYPE_OPTIONS: { value: WorkoutType; icon: string; pt: string; en: string }[] = [
  { value: "strength",  icon: "🏋️", pt: "Força",      en: "Strength"  },
  { value: "cardio",    icon: "🏃", pt: "Cardio",     en: "Cardio"    },
  { value: "sports",    icon: "⚽", pt: "Desporto",   en: "Sports"    },
  { value: "yoga",      icon: "🧘", pt: "Yoga",       en: "Yoga"      },
  { value: "mobility",  icon: "🤸", pt: "Mobilidade", en: "Mobility"  },
  { value: "other",     icon: "💪", pt: "Outro",      en: "Other"     },
];

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  manual:       { label: "Manual",       cls: "bg-zinc-700/60 text-zinc-300" },
  strava:       { label: "Strava",       cls: "bg-orange-900/40 text-orange-400" },
  apple_health: { label: "Apple Health", cls: "bg-pink-900/40 text-pink-400" },
  garmin:       { label: "Garmin",       cls: "bg-blue-900/40 text-blue-400" },
};

function fmtDate(d: string, locale: string) {
  return new Date(d + "T12:00:00").toLocaleDateString(locale, {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function MyWorkoutsPage() {
  const { lang } = useLang();
  const isEN = lang === "en";
  const locale = isEN ? "en-GB" : "pt-PT";

  const [workouts, setWorkouts] = useState<ClientWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle]       = useState("");
  const [type, setType]         = useState<WorkoutType>("strength");
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [notes, setNotes]       = useState("");

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
      setError(d.error ?? (isEN ? "Failed to save." : "Erro ao guardar."));
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
    setDeleting(null);
  }

  const card = {
    background: "linear-gradient(160deg,rgba(39,39,42,0.9) 0%,rgba(18,18,22,0.95) 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  return (
    <div className="space-y-4 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            {isEN ? "My Workouts" : "Os meus treinos"}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {isEN ? "Log your own sessions" : "Regista as tuas sessões"}
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="shrink-0 h-10 px-4 rounded-xl text-sm font-bold text-black transition-opacity active:opacity-70"
          style={{ background: "linear-gradient(135deg,#C9A84C,#A8893A)" }}
        >
          {showForm ? (isEN ? "Cancel" : "Cancelar") : (isEN ? "+ Log" : "+ Adicionar")}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-4 space-y-4" style={card}>
          <h2 className="text-white font-bold text-base">
            {isEN ? "New workout" : "Novo treino"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Type selector — pill grid */}
            <div>
              <label className="label mb-2 block">{isEN ? "Type" : "Tipo"}</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border transition-all active:scale-95"
                    style={type === opt.value
                      ? { background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.5)" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    <span className="text-xl leading-none">{opt.icon}</span>
                    <span className={`text-[11px] font-semibold ${type === opt.value ? "text-brand-gold" : "text-zinc-400"}`}>
                      {isEN ? opt.en : opt.pt}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label">{isEN ? "Name" : "Nome"}</label>
              <input
                className="input text-base"
                required
                placeholder={isEN ? "e.g. Chest & Triceps" : "ex: Peito e Tríceps"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Date + Duration side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{isEN ? "Date" : "Data"}</label>
                <input
                  type="date" className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div>
                <label className="label">{isEN ? "Duration (min)" : "Duração (min)"}</label>
                <input
                  type="number" className="input"
                  min={1} max={600}
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">{isEN ? "Notes" : "Notas"} <span className="text-zinc-600 font-normal">{isEN ? "(optional)" : "(opcional)"}</span></label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder={isEN ? "How did it go?" : "Como correu?"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {saving
                ? (isEN ? "Saving…" : "A guardar…")
                : (isEN ? "Save workout" : "Guardar treino")}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map((i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={card}>
          <p className="text-4xl mb-3">💪</p>
          <p className="text-white font-semibold text-sm">
            {isEN ? "No workouts yet" : "Nenhum treino registado"}
          </p>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
            {isEN
              ? "Log your first session above, or connect Strava to import automatically."
              : "Regista a tua primeira sessão acima, ou liga o Strava para importar automaticamente."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {workouts.map((w) => {
            const typeInfo = w.type ? TYPE_OPTIONS.find((o) => o.value === w.type) : null;
            const src = SOURCE_BADGE[w.source] ?? SOURCE_BADGE.manual;
            return (
              <div key={w.id} className="rounded-2xl px-4 py-3" style={card}>
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5 shrink-0">
                    {typeInfo?.icon ?? "💪"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold leading-tight truncate">{w.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-zinc-500 text-xs">{fmtDate(w.date, locale)}</span>
                          {w.duration_min && <span className="text-zinc-500 text-xs">· {w.duration_min} min</span>}
                          {w.calories && <span className="text-zinc-500 text-xs">· {w.calories} kcal</span>}
                          {w.distance_km && <span className="text-zinc-500 text-xs">· {w.distance_km} km</span>}
                        </div>
                      </div>
                      {w.source === "manual" && (
                        <button
                          onClick={() => handleDelete(w.id)}
                          disabled={deleting === w.id}
                          className="text-zinc-600 hover:text-red-400 transition-colors text-xl leading-none shrink-0 -mt-0.5 px-1"
                          aria-label="Apagar"
                        >
                          {deleting === w.id ? "…" : "×"}
                        </button>
                      )}
                    </div>
                    {(w.source !== "manual" || w.notes) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${src.cls}`}>
                          {src.label}
                        </span>
                        {w.notes && (
                          <p className="text-zinc-500 text-xs truncate">{w.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strava tip */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}
      >
        <span className="text-brand-gold text-base shrink-0">⚡</span>
        <p className="text-zinc-400 text-xs leading-relaxed">
          {isEN
            ? <>Connect Strava to import workouts automatically. <a href="/client/integrations" className="text-brand-gold">Integrations →</a></>
            : <>Liga o Strava para importar os teus treinos automaticamente. <a href="/client/integrations" className="text-brand-gold">Integrações →</a></>
          }
        </p>
      </div>
    </div>
  );
}
