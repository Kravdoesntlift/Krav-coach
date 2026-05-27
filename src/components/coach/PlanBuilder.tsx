"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, WorkoutPlan } from "@/lib/supabase/types";
import { DAY_NAMES_FULL } from "@/lib/supabase/types";

interface ExerciseInput {
  name: string;
  sets: string;
  reps: string;
  notes: string;
  video_url: string;
  superset_group?: string; // e.g. "A", "B", "C" — exercises with same letter are done back-to-back
}

interface DayInput {
  day_of_week: number;
  label: string;
  is_rest: boolean;
  exercises: ExerciseInput[];
}

interface LibraryExercise {
  id: string;
  name: string;
  muscle_groups: string[];
  description: string | null;
  video_url: string | null;
}

interface Props {
  coachId: string;
  clients: Profile[];
  preselectedClientId?: string;
  existingPlan?: WorkoutPlan;
  libraryItems?: LibraryExercise[];
}

function planToDayInputs(plan: WorkoutPlan): DayInput[] {
  return (plan.workout_days ?? []).map((d) => ({
    day_of_week: d.day_of_week,
    label: d.label ?? "",
    is_rest: d.is_rest ?? false,
    exercises: (d.exercises ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map((ex) => ({
        name: ex.name,
        sets: String(ex.sets),
        reps: ex.reps,
        notes: ex.notes ?? "",
        video_url: ex.video_url ?? "",
        superset_group: ex.superset_group ?? "",
      })),
  }));
}

interface Template {
  id: string;
  name: string;
  days: DayInput[];
}

export default function PlanBuilder({ coachId, clients, preselectedClientId, existingPlan, libraryItems = [], templates = [], suggestMode = false }: Props & { templates?: Template[]; suggestMode?: boolean }) {
  const router = useRouter();
  const isEdit = !!existingPlan;

  const [clientId, setClientId] = useState(existingPlan?.client_id ?? preselectedClientId ?? "");
  const [planName, setPlanName] = useState(existingPlan?.name ?? "");
  const [weekStart, setWeekStart] = useState(() => {
    if (existingPlan) return existingPlan.week_start;
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    // Use local date to avoid UTC shift when browser is UTC+1 or more
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const d = String(monday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [days, setDays] = useState<DayInput[]>(existingPlan ? planToDayInputs(existingPlan) : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [libraryPicker, setLibraryPicker] = useState<number | null>(null); // day_of_week being picked
  const [librarySearch, setLibrarySearch] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);

  // Load AI-suggested plan from sessionStorage when coming from SuggestPlanButton
  useEffect(() => {
    if (!suggestMode) return;
    try {
      const stored = sessionStorage.getItem("ai_suggested_plan");
      if (!stored) return;
      sessionStorage.removeItem("ai_suggested_plan");
      const suggested = JSON.parse(stored) as {
        name: string;
        days: Array<{
          day_of_week: number;
          label: string;
          is_rest: boolean;
          exercises: Array<{ name: string; sets: number; reps: string; notes: string }>;
        }>;
      };
      if (suggested.name) setPlanName(suggested.name);
      setDays(
        suggested.days.map((d) => ({
          day_of_week: d.day_of_week,
          label: d.label,
          is_rest: d.is_rest,
          exercises: (d.exercises ?? []).map((ex) => ({
            name: ex.name,
            sets: String(ex.sets),
            reps: String(ex.reps),
            notes: ex.notes ?? "",
            video_url: "",
            superset_group: "",
          })),
        }))
      );
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestMode]);

  async function generateWithAI() {
    if (!clientId) { setError("Seleciona um cliente primeiro."); return; }
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setAiError(json.error ?? "Erro ao gerar plano"); return; }

      const aiPlan = json.plan as { name: string; days: { day_of_week: number; label: string; is_rest: boolean; exercises: { name: string; sets: number; reps: number; notes?: string }[] }[] };
      setPlanName(aiPlan.name);
      setDays(aiPlan.days.map((d) => ({
        day_of_week: d.day_of_week,
        label: d.label,
        is_rest: d.is_rest,
        exercises: (d.exercises ?? []).map((ex) => ({
          name: ex.name,
          sets: String(ex.sets),
          reps: String(ex.reps),
          notes: ex.notes ?? "",
          video_url: "",
        })),
      })));
    } catch (e: unknown) {
      setAiError((e as Error).message ?? "Erro desconhecido");
    } finally {
      setAiGenerating(false);
    }
  }

  function addDay(dayOfWeek: number) {
    if (days.some((d) => d.day_of_week === dayOfWeek)) return;
    setDays((prev) =>
      [...prev, { day_of_week: dayOfWeek, label: "", is_rest: false, exercises: [] }].sort(
        (a, b) => a.day_of_week - b.day_of_week
      )
    );
  }

  function removeDay(dayOfWeek: number) {
    setDays((prev) => prev.filter((d) => d.day_of_week !== dayOfWeek));
  }

  function updateDay(dayOfWeek: number, patch: Partial<DayInput>) {
    setDays((prev) => prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...patch } : d)));
  }

  function addExercise(dayOfWeek: number) {
    const day = days.find((d) => d.day_of_week === dayOfWeek);
    updateDay(dayOfWeek, {
      exercises: [...(day?.exercises ?? []), { name: "", sets: "3", reps: "10", notes: "", video_url: "", superset_group: "" }],
    });
  }

  function importFromLibrary(dayOfWeek: number, lib: LibraryExercise) {
    const day = days.find((d) => d.day_of_week === dayOfWeek);
    updateDay(dayOfWeek, {
      exercises: [...(day?.exercises ?? []), {
        name: lib.name,
        sets: "3",
        reps: "10",
        notes: "",
        video_url: lib.video_url ?? "",
        superset_group: "",
      }],
    });
    setLibraryPicker(null);
    setLibrarySearch("");
  }

  function updateExercise(dayOfWeek: number, idx: number, patch: Partial<ExerciseInput>) {
    const day = days.find((d) => d.day_of_week === dayOfWeek);
    if (!day) return;
    updateDay(dayOfWeek, {
      exercises: day.exercises.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)),
    });
  }

  function removeExercise(dayOfWeek: number, idx: number) {
    const day = days.find((d) => d.day_of_week === dayOfWeek);
    if (!day) return;
    updateDay(dayOfWeek, { exercises: day.exercises.filter((_, i) => i !== idx) });
  }

  async function saveDaysAndExercises(supabase: ReturnType<typeof createClient>, planId: string) {
    for (const [i, day] of days.entries()) {
      const { data: dayRow } = await supabase
        .from("workout_days")
        .insert({
          plan_id: planId,
          day_of_week: day.day_of_week,
          label: day.label || null,
          is_rest: day.is_rest,
          order_index: i,
        })
        .select()
        .single();

      if (!dayRow || day.is_rest) continue;

      const exerciseRows = day.exercises
        .filter((ex) => ex.name.trim())
        .map((ex, j) => ({
          day_id: dayRow.id,
          name: ex.name.trim(),
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps.trim() || "10",
          notes: ex.notes.trim() || null,
          video_url: ex.video_url.trim() || null,
          superset_group: ex.superset_group?.trim() || null,
          order_index: j,
        }));

      if (exerciseRows.length > 0) {
        await supabase.from("exercises").insert(exerciseRows);
      }
    }
  }

  async function saveAsTemplate() {
    if (!planName.trim() || days.length === 0) return;
    setSavingTemplate(true);
    const supabase = createClient();
    await supabase.from("plan_templates").insert({
      coach_id: coachId,
      name: planName.trim(),
      days: days,
    });
    setSavingTemplate(false);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  }

  function loadTemplate(t: Template) {
    setDays(t.days);
    if (!planName) setPlanName(t.name);
    setShowTemplates(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return setError("Seleciona um cliente.");
    if (!planName.trim()) return setError("Dá um nome ao plano.");
    if (days.length === 0) return setError("Adiciona pelo menos um dia.");

    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (isEdit && existingPlan) {
      const { error: updateErr } = await supabase
        .from("workout_plans")
        .update({ name: planName.trim(), week_start: weekStart })
        .eq("id", existingPlan.id);

      if (updateErr) { setError("Erro ao atualizar plano."); setLoading(false); return; }

      await supabase.from("workout_days").delete().eq("plan_id", existingPlan.id);
      await saveDaysAndExercises(supabase, existingPlan.id);

      // Notify client — plan updated
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: existingPlan.client_id,
          title: "📋 Plano atualizado",
          body: `O teu plano "${planName.trim()}" foi atualizado pelo teu coach.`,
          url: "/client/dashboard",
        }),
      }).catch(() => {});

      router.push(`/coach/clients/${existingPlan.client_id}`);
    } else {
      const { data: plan, error: planErr } = await supabase
        .from("workout_plans")
        .insert({ coach_id: coachId, client_id: clientId, name: planName.trim(), week_start: weekStart })
        .select()
        .single();

      if (planErr || !plan) { setError("Erro ao criar plano."); setLoading(false); return; }

      await saveDaysAndExercises(supabase, plan.id);

      // Notify client — new plan assigned
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clientId,
          title: "💪 Novo plano de treino!",
          body: `O teu coach criou um novo plano: "${planName.trim()}". Vai lá!`,
          url: "/client/dashboard",
        }),
      }).catch(() => {});

      router.push(`/coach/clients/${clientId}`);
    }
  }

  const selectedDays = new Set(days.map((d) => d.day_of_week));

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-white font-semibold">Informação do plano</h2>

        {!isEdit && (
          <div>
            <label className="label">Cliente</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
              <option value="">Seleciona um cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Nome do plano</label>
          <input
            type="text" value={planName} onChange={(e) => setPlanName(e.target.value)}
            className="input" placeholder="ex: Semana de hipertrofia"
          />
        </div>

        <div>
          <label className="label">Semana (início — Segunda-feira)</label>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input" />
        </div>

        {/* AI generation */}
        {!isEdit && (
          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={generateWithAI}
              disabled={aiGenerating || !clientId}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.08))", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}
            >
              {aiGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin" />
                  A gerar plano com IA...
                </>
              ) : (
                <>✨ Gerar plano com IA</>
              )}
            </button>
            {aiError && <p className="text-red-400 text-xs text-center">{aiError}</p>}
            {!clientId && <p className="text-zinc-600 text-xs text-center">Seleciona um cliente para usar a IA</p>}
            {clientId && !aiGenerating && (
              <p className="text-zinc-600 text-xs text-center">A IA lê o onboarding do cliente e gera um plano personalizado</p>
            )}
          </div>
        )}
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="card p-4">
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="font-medium text-white">Carregar template</span>
            <span>{showTemplates ? "▲" : "▼"}</span>
          </button>
          {showTemplates && (
            <div className="mt-3 space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadTemplate(t)}
                  className="w-full text-left px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors"
                >
                  {t.name}
                  <span className="text-gray-500 ml-2 text-xs">{t.days.length} dias</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Day selector */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4">Dias</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <button
              key={d} type="button"
              onClick={() => (selectedDays.has(d) ? removeDay(d) : addDay(d))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDays.has(d) ? "bg-brand-gold text-black" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
              }`}
            >
              {DAY_NAMES_FULL[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Day editors */}
      {days.map((day) => (
        <div key={day.day_of_week} className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">{DAY_NAMES_FULL[day.day_of_week]}</h3>
            <button
              type="button" onClick={() => removeDay(day.day_of_week)}
              className="text-xs text-gray-500 hover:text-brand-gold transition-colors"
            >
              Remover dia
            </button>
          </div>

          {/* Rest day toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => updateDay(day.day_of_week, { is_rest: !day.is_rest, exercises: day.is_rest ? day.exercises : [] })}
              className={`w-10 h-5 rounded-full transition-colors relative ${day.is_rest ? "bg-brand-gold" : "bg-zinc-700"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${day.is_rest ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-sm text-gray-400">
              {day.is_rest ? <span className="text-brand-gold">Dia de descanso</span> : "Treino"}
            </span>
          </label>

          {!day.is_rest && (
            <>
              <div>
                <label className="label">Etiqueta (opcional)</label>
                <input
                  type="text" value={day.label}
                  onChange={(e) => updateDay(day.day_of_week, { label: e.target.value })}
                  className="input" placeholder="ex: Push, Pernas, Full Body..."
                />
              </div>

              <div className="space-y-3">
                {day.exercises.map((ex, i) => (
                  <div key={i} className="bg-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Exercício {i + 1}</span>
                      <button
                        type="button" onClick={() => removeExercise(day.day_of_week, i)}
                        className="text-xs text-gray-600 hover:text-brand-gold transition-colors"
                      >
                        Remover
                      </button>
                    </div>

                    <input
                      type="text" value={ex.name}
                      onChange={(e) => updateExercise(day.day_of_week, i, { name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
                      placeholder="Nome do exercício"
                    />

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Séries</label>
                        <input
                          type="number" min="1" value={ex.sets}
                          onChange={(e) => updateExercise(day.day_of_week, i, { sets: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                        <input
                          type="text" value={ex.reps}
                          onChange={(e) => updateExercise(day.day_of_week, i, { reps: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold transition-colors"
                          placeholder="ex: 10, 8-12"
                        />
                      </div>
                    </div>

                    <input
                      type="text" value={ex.notes}
                      onChange={(e) => updateExercise(day.day_of_week, i, { notes: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
                      placeholder="Notas (ex: 2 min descanso)"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-sm">▶</span>
                      <input
                        type="url" value={ex.video_url}
                        onChange={(e) => updateExercise(day.day_of_week, i, { video_url: e.target.value })}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold transition-colors"
                        placeholder="Link do vídeo (YouTube, opcional)"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 text-sm font-semibold shrink-0">SS</span>
                      <input
                        type="text" maxLength={1}
                        value={ex.superset_group ?? ""}
                        onChange={(e) => updateExercise(day.day_of_week, i, { superset_group: e.target.value.toUpperCase() })}
                        className="w-12 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="A"
                      />
                      <span className="text-zinc-600 text-xs">Mesma letra = superset</span>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <button
                    type="button" onClick={() => addExercise(day.day_of_week)}
                    className="flex-1 py-2.5 rounded-lg border border-dashed border-zinc-700 text-gray-500 hover:border-zinc-500 hover:text-gray-300 text-sm transition-colors"
                  >
                    + Escrever exercício
                  </button>
                  {libraryItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setLibraryPicker(day.day_of_week); setLibrarySearch(""); }}
                      className="px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors"
                      style={{ borderColor: "rgba(201,168,76,0.35)", color: "#C9A84C", background: "rgba(201,168,76,0.07)" }}
                    >
                      📚 Da biblioteca
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ))}

      {error && (
        <p className="text-brand-gold text-sm bg-yellow-950/20 border border-brand-gold/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {!isEdit && days.length > 0 && planName.trim() && (
          <button
            type="button"
            onClick={saveAsTemplate}
            disabled={savingTemplate}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${templateSaved ? "border-green-500 text-green-400" : "border-zinc-600 text-gray-400 hover:border-zinc-400 hover:text-white"}`}
          >
            {templateSaved ? "Template guardado!" : savingTemplate ? "..." : "Guardar como template"}
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base">
          {loading ? "A guardar..." : isEdit ? "Guardar alterações" : "Criar Plano"}
        </button>
      </div>
    </form>

    {/* Library picker modal */}

    {libraryPicker !== null && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
        <div className="w-full max-w-lg rounded-2xl flex flex-col animate-fade-in" style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="font-bold text-white">Importar da biblioteca</h3>
            <button onClick={() => setLibraryPicker(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">✕</button>
          </div>
          {/* Search */}
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              autoFocus
              placeholder="Pesquisar exercício..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="input w-full"
            />
          </div>
          {/* List */}
          <div className="overflow-y-auto flex-1 p-3 space-y-1">
            {libraryItems
              .filter((ex) =>
                ex.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
                ex.muscle_groups.some((mg) => mg.toLowerCase().includes(librarySearch.toLowerCase()))
              )
              .map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => importFromLibrary(libraryPicker, ex)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between gap-3 transition-colors hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{ex.name}</p>
                    <p className="text-zinc-500 text-xs truncate">{ex.muscle_groups.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ex.video_url && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C" }}>
                        vídeo
                      </span>
                    )}
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-zinc-600"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/></svg>
                  </div>
                </button>
              ))
            }
            {libraryItems.filter((ex) =>
              ex.name.toLowerCase().includes(librarySearch.toLowerCase()) ||
              ex.muscle_groups.some((mg) => mg.toLowerCase().includes(librarySearch.toLowerCase()))
            ).length === 0 && (
              <p className="text-center text-zinc-500 text-sm py-8">Nenhum exercício encontrado.</p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
