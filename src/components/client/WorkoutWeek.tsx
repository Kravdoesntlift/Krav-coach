"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutPlan, WorkoutDay, Exercise } from "@/lib/supabase/types";
import { DAY_NAMES_FULL } from "@/lib/supabase/types";
import ProgressRing from "@/components/ui/ProgressRing";
import Confetti from "@/components/ui/Confetti";
import LiveWorkout from "@/components/client/LiveWorkout";
import { haptic, HAPTIC } from "@/lib/haptic";
import { useLang } from "@/lib/i18n/useLang";
import { enqueueOfflineAction, useOfflineSync } from "@/hooks/useOfflineQueue";

// Strings not in the shared dictionary
const extra = {
  this_week:          { pt: "Esta semana",                en: "This week" },
  workouts_done:      { pt: "treinos concluídos",         en: "workouts done" },
  perfect_week:       { pt: "Semana perfeita!",           en: "Perfect week!" },
  rest_recover:       { pt: "recupera bem 💤",            en: "recover well 💤" },
  no_exercises:       { pt: "Sem exercícios.",            en: "No exercises." },
  exercise_singular:  { pt: "exercício",                  en: "exercise" },
  exercise_plural:    { pt: "exercícios",                 en: "exercises" },
  start_btn:          { pt: "▶ Iniciar",                  en: "▶ Start" },
  rest_timer_lbl:     { pt: "⏱ Timer de descanso",       en: "⏱ Rest timer" },
  how_was_workout:    { pt: "Como correu o treino?",      en: "How did the workout go?" },
  feeling_heavy:      { pt: "Pesado",                     en: "Heavy" },
  feeling_ok:         { pt: "Ok",                         en: "Ok" },
  feeling_good:       { pt: "Bem",                        en: "Good" },
  feeling_top:        { pt: "Top",                        en: "Top" },
  quick_note:         { pt: "Nota rápida (opcional)...", en: "Quick note (optional)..." },
  volume_today:       { pt: "volume hoje",                en: "today's volume" },
  mark_complete:      { pt: "Marcar como concluído",      en: "Mark as complete" },
  workout_done_check: { pt: "Treino concluído ✓",        en: "Workout done ✓" },
  rest_day_label:     { pt: "Dia de descanso",            en: "Rest day" },
  superset_lbl:       { pt: "Superset",                   en: "Superset" },
  warmup_short:       { pt: "Aq.",                        en: "Wm." },
  warmup_label:       { pt: "Aquecimento",                en: "Warm-up" },
  working_label:      { pt: "Trabalho",                   en: "Working" },
  working_short:      { pt: "Trab.",                      en: "Work." },
  dropset_label:      { pt: "Dropset",                    en: "Dropset" },
  dropset_short:      { pt: "Drop",                       en: "Drop" },
  warmup_set:         { pt: "Aq.",                        en: "Wm." },
  series_lbl:         { pt: "Série",                      en: "Set" },
  drop_lbl:           { pt: "Drop",                       en: "Drop" },
  add_set:            { pt: "+ Adicionar série",          en: "+ Add set" },
  saving:             { pt: "A guardar...",               en: "Saving..." },
  saved:              { pt: "Guardado!",                  en: "Saved!" },
  save_log:           { pt: "Guardar registo",            en: "Save log" },
  register_weights:   { pt: "Registar pesos",             en: "Log weights" },
  watch_video_arrow:  { pt: "Ver vídeo →",               en: "Watch video →" },
  dropset_hint:       { pt: "Adiciona séries com peso decrescente", en: "Add sets with decreasing weight" },
  overload_tap:       { pt: "toca para aplicar",         en: "tap to apply" },
  suggestion:         { pt: "Sugestão:",                  en: "Suggestion:" },
  last_vol:           { pt: "Volume última sessão:",      en: "Last session volume:" },
  recent_sessions:    { pt: "Últimas sessões",            en: "Recent sessions" },
  vol_suffix:         { pt: "kg vol",                     en: "kg vol" },
  rest_timer_title:   { pt: "Timer de descanso",         en: "Rest timer" },
  close_btn:          { pt: "Fechar",                     en: "Close" },
  rest_done:          { pt: "Pronto! Volta ao treino 💪", en: "Done! Back to workout 💪" },
  pause_btn:          { pt: "Pausar",                     en: "Pause" },
  continue_btn:       { pt: "Continuar",                  en: "Continue" },
  reset_btn:          { pt: "Reset",                      en: "Reset" },
  confirm_btn:        { pt: "Confirmar",                  en: "Confirm" },
  coach_push_title:   { pt: "💪 Treino concluído!",      en: "💪 Workout done!" },
  coach_push_body:    { pt: "O teu cliente completou o treino de hoje.", en: "Your client completed today's workout." },
} as const;

interface Props {
  plan: WorkoutPlan;
  clientId: string;
  coachId?: string;
}

export default function WorkoutWeek({ plan, clientId, coachId }: Props) {
  const { t, lang } = useLang();
  useOfflineSync(); // drain offline queue when connection returns
  const days = plan.workout_days ?? [];
  const sortedDays = [...days].sort((a, b) => a.day_of_week - b.day_of_week);
  const today = new Date().getDay();

  const trainDays = days.filter((d) => !d.is_rest);
  const initialCompleted = trainDays.filter((d) =>
    d.workout_completions?.some((c) => c.client_id === clientId)
  ).length;

  const [completedCount, setCompletedCount] = useState(initialCompleted);
  const [showConfetti, setShowConfetti] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);

  const pct = trainDays.length > 0 ? Math.round((completedCount / trainDays.length) * 100) : 0;
  const isPerfect = trainDays.length > 0 && completedCount >= trainDays.length;

  function handleDayComplete() {
    setCompletedCount((n) => {
      const next = n + 1;
      if (next >= trainDays.length && initialCompleted < trainDays.length) {
        setShowConfetti(true);
      }
      return next;
    });
  }

  function handleDayUndo() {
    setCompletedCount((n) => Math.max(0, n - 1));
  }

  return (
    <>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div className="space-y-4">
        {/* Weekly progress ring — clickable header */}
        {trainDays.length > 0 && (
          <button
            onClick={() => setWeekOpen((o) => !o)}
            className="w-full text-left card-gold p-4 md:p-5 flex items-center gap-4 md:gap-5 transition-all"
          >
            <ProgressRing value={pct} size={72} strokeWidth={6} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base tracking-tight">{extra.this_week[lang]}</p>
              <p className="text-zinc-400 text-sm mt-0.5">
                <span className="text-white font-bold">{completedCount}</span>
                <span className="text-zinc-600"> / {trainDays.length}</span>
                {" "}{extra.workouts_done[lang]}
              </p>
              {isPerfect ? (
                <p className="text-green-400 text-xs font-semibold mt-1.5 pop flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 glow-breathe" />
                  {extra.perfect_week[lang]}
                </p>
              ) : completedCount > 0 ? (
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: trainDays.length }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        i < completedCount ? "bg-brand-gold" : "bg-zinc-800"
                      }`}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            {/* Toggle arrow */}
            <span
              className="text-zinc-600 text-sm shrink-0 transition-transform duration-300"
              style={{ transform: weekOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
            >
              ▼
            </span>
          </button>
        )}

        {/* Day cards — collapsible */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: weekOpen ? "1fr" : "0fr",
            transition: "grid-template-rows 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div style={{ overflow: "hidden" }}>
          <div className="space-y-3 pt-1">
            {sortedDays.map((day) => (
              <WorkoutDayCard
                key={day.id}
                day={day}
                clientId={clientId}
                coachId={coachId}
                isToday={day.day_of_week === today}
                onComplete={handleDayComplete}
                onUndo={handleDayUndo}
              />
            ))}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

function WorkoutDayCard({
  day,
  clientId,
  coachId,
  isToday,
  onComplete,
  onUndo,
}: {
  day: WorkoutDay;
  clientId: string;
  coachId?: string;
  isToday: boolean;
  onComplete?: () => void;
  onUndo?: () => void;
}) {
  const { t, lang } = useLang();
  const completions = day.workout_completions ?? [];
  const isCompleted = completions.some((c) => c.client_id === clientId);
  const existingCompletion = completions.find((c) => c.client_id === clientId);
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [open, setOpen] = useState(isToday && !day.is_rest);
  const [showTimer, setShowTimer] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [feeling, setFeeling] = useState(existingCompletion?.feeling ?? "");
  const [note, setNote] = useState(existingCompletion?.note ?? "");
  const [sessionVolume, setSessionVolume] = useState<number | null>(null);

  const exercises = day.exercises ?? [];

  async function handleComplete() {
    if (!feeling) { setShowFeedback(true); return; }
    await saveComplete(feeling, note);
  }

  async function saveComplete(f: string, n: string) {
    setLoading(true);
    const supabase = createClient();
    const completionData = {
      client_id: clientId,
      day_id: day.id,
      feeling: f,
      note: n.trim() || null,
    };
    const { error: insertErr } = await supabase
      .from("workout_completions")
      .insert(completionData);
    // If offline or network error, queue for later sync
    if (insertErr && (insertErr.message?.includes("fetch") || !navigator.onLine)) {
      enqueueOfflineAction("completion", completionData);
    }

    // Calculate today's session volume from workout_logs
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const exerciseIds = exercises.map((e) => e.name);
    if (exerciseIds.length > 0) {
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("sets")
        .eq("client_id", clientId)
        .eq("logged_at", todayStr)
        .in("exercise_name", exerciseIds);

      const vol = (logs ?? []).reduce((total, log) => {
        const sets = (log.sets ?? []) as { weight_kg: number | null; reps: number; done: boolean; type?: string }[];
        return total + sets
          .filter((s) => s.done && s.weight_kg && (!s.type || s.type === "working"))
          .reduce((sum, s) => sum + (s.weight_kg ?? 0) * s.reps, 0);
      }, 0);
      if (vol > 0) setSessionVolume(Math.round(vol));
    }

    haptic(HAPTIC.success);

    // Notify coach (best-effort)
    if (coachId) {
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: coachId,
          title: extra.coach_push_title[lang],
          body: extra.coach_push_body[lang],
          url: `/coach/clients/${clientId}`,
        }),
      }).catch(() => {});
    }

    setCompleted(true);
    setShowFeedback(false);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 700);
    setLoading(false);
    onComplete?.();
  }

  async function undoComplete() {
    setLoading(true);
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("workout_completions")
      .delete()
      .eq("client_id", clientId)
      .eq("day_id", day.id);
    if (delErr && (delErr.message?.includes("fetch") || !navigator.onLine)) {
      enqueueOfflineAction("undo_completion", { client_id: clientId, day_id: day.id });
    }
    setCompleted(false);
    setFeeling("");
    setNote("");
    setLoading(false);
    onUndo?.();
  }

  // Rest day
  if (day.is_rest) {
    return (
      <div className={`card px-5 py-4 flex items-center gap-3 ${isToday ? "border-zinc-600" : "opacity-60"}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0" />
        <div>
          <p className="text-gray-400 font-medium text-sm">
            {DAY_NAMES_FULL[day.day_of_week]}
            {isToday && <span className="ml-2 text-xs text-brand-gold">{t("today")}</span>}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            {day.label || extra.rest_day_label[lang]} — {extra.rest_recover[lang]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    {liveMode && (
      <LiveWorkout
        exercises={exercises}
        dayId={day.id}
        clientId={clientId}
        dayLabel={day.label || DAY_NAMES_FULL[day.day_of_week]}
        onComplete={async (f, n) => { await saveComplete(f, n); setLiveMode(false); }}
        onClose={() => setLiveMode(false)}
      />
    )}
    <div className={`card overflow-hidden transition-all ${isToday ? "border-zinc-600" : ""} ${completed ? "opacity-70" : ""}`}>
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${completed ? "bg-green-500" : isToday ? "bg-brand-gold" : "bg-zinc-700"}`} />
          <div>
            <p className="font-semibold text-white">
              {DAY_NAMES_FULL[day.day_of_week]}
              {isToday && <span className="ml-2 text-xs text-brand-gold font-normal">{t("today")}</span>}
            </p>
            {day.label && <p className="text-xs text-gray-500 mt-0.5">{day.label}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {exercises.length} {exercises.length !== 1 ? extra.exercise_plural[lang] : extra.exercise_singular[lang]}
          </span>
          {!completed && exercises.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLiveMode(true); }}
              className="px-2.5 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-semibold hover:bg-brand-gold/20 transition-colors"
            >
              {extra.start_btn[lang]}
            </button>
          )}
          <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-800">
          {exercises.length === 0 ? (
            <p className="text-gray-500 text-sm px-5 py-4">{extra.no_exercises[lang]}</p>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {(() => {
                const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);
                const rendered: React.ReactNode[] = [];
                let i = 0;
                while (i < sorted.length) {
                  const ex = sorted[i];
                  const group = ex.superset_group?.trim();
                  if (group) {
                    // collect all consecutive exercises with same superset group
                    const groupExercises = [ex];
                    let j = i + 1;
                    while (j < sorted.length && sorted[j].superset_group?.trim() === group) {
                      groupExercises.push(sorted[j]);
                      j++;
                    }
                    rendered.push(
                      <div key={`ss-${group}-${i}`} className="relative border-l-2 border-orange-500/60 ml-0">
                        <div className="absolute left-0 top-2 -translate-x-1/2 z-10">
                          <span className="bg-orange-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                            {group}
                          </span>
                        </div>
                        <div className="pl-3">
                          <div className="px-5 pt-2 pb-1">
                            <span className="text-orange-400 text-xs font-semibold tracking-wide uppercase">{extra.superset_lbl[lang]} {group}</span>
                          </div>
                          <div className="divide-y divide-zinc-800/30">
                            {groupExercises.map((gex) => (
                              <ExerciseRow key={gex.id} exercise={gex} dayId={day.id} clientId={clientId} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                    i = j;
                  } else {
                    rendered.push(
                      <ExerciseRow key={ex.id} exercise={ex} dayId={day.id} clientId={clientId} />
                    );
                    i++;
                  }
                }
                return rendered;
              })()}
            </div>
          )}

          {/* Timer + complete button */}
          <div className="px-4 md:px-5 py-3 md:py-4 border-t border-zinc-800 space-y-3">
            {showTimer ? (
              <RestTimer onClose={() => setShowTimer(false)} />
            ) : (
              <button
                onClick={() => setShowTimer(true)}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white text-sm transition-colors"
              >
                {extra.rest_timer_lbl[lang]}
              </button>
            )}

            {/* Feedback panel */}
            {showFeedback && !completed && (
              <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-sm text-white font-medium">{extra.how_was_workout[lang]}</p>
                <div className="flex gap-2">
                  {[
                    { emoji: "😓", labelKey: "feeling_heavy" as const },
                    { emoji: "😐", labelKey: "feeling_ok" as const },
                    { emoji: "💪", labelKey: "feeling_good" as const },
                    { emoji: "🔥", labelKey: "feeling_top" as const },
                  ].map(({ emoji, labelKey }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFeeling(emoji)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-lg text-lg transition-colors ${
                        feeling === emoji
                          ? "bg-brand-gold/20 ring-1 ring-brand-gold"
                          : "bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    >
                      {emoji}
                      <span className="text-xs text-gray-400 mt-0.5">{extra[labelKey][lang]}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={extra.quick_note[lang]}
                  maxLength={120}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 py-2 rounded-lg bg-zinc-700 text-gray-400 text-sm transition-colors hover:bg-zinc-600"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={() => feeling && saveComplete(feeling, note)}
                    disabled={!feeling || loading}
                    className="flex-1 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold transition-colors disabled:opacity-40"
                  >
                    {loading ? "..." : extra.confirm_btn[lang]}
                  </button>
                </div>
              </div>
            )}

            {/* Completed state: feeling + session volume */}
            {completed && (
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  {feeling && <span className="text-xl">{feeling}</span>}
                  {note && <span className="text-gray-400 text-xs">{note}</span>}
                </div>
                {sessionVolume && (
                  <div className="text-right">
                    <p className="text-brand-gold text-sm font-bold">{sessionVolume.toLocaleString("pt-PT")} kg</p>
                    <p className="text-zinc-600 text-[10px]">{extra.volume_today[lang]}</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={completed ? undoComplete : handleComplete}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                pulsing ? "pulse-gold" : ""
              } ${
                completed
                  ? "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  : "bg-brand-gold hover:bg-brand-gold-dark text-black"
              }`}
            >
              {loading ? "..." : completed ? extra.workout_done_check[lang] : extra.mark_complete[lang]}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Set types ──────────────────────────────────────────────────────────────
type SetType = "warmup" | "working" | "dropset";
interface SetEntry { weight_kg: string; reps: string; done: boolean; }
type SetsMap = Record<SetType, SetEntry[]>;

const SET_TABS_DEF: { type: SetType; labelKey: "warmup_label" | "working_label" | "dropset_label"; shortKey: "warmup_short" | "working_short" | "dropset_short"; color: string; dotColor: string; ringColor: string; doneColor: string }[] = [
  {
    type: "warmup",
    labelKey: "warmup_label",
    shortKey: "warmup_short",
    color: "text-sky-400",
    dotColor: "bg-sky-500",
    ringColor: "border-sky-500",
    doneColor: "bg-sky-500 border-sky-500",
  },
  {
    type: "working",
    labelKey: "working_label",
    shortKey: "working_short",
    color: "text-brand-gold",
    dotColor: "bg-brand-gold",
    ringColor: "border-brand-gold",
    doneColor: "bg-brand-gold border-brand-gold",
  },
  {
    type: "dropset",
    labelKey: "dropset_label",
    shortKey: "dropset_short",
    color: "text-orange-400",
    dotColor: "bg-orange-500",
    ringColor: "border-orange-500",
    doneColor: "bg-orange-500 border-orange-500",
  },
];

function makeDefaultSets(type: SetType, exSets: number, exReps: number | string): SetEntry[] {
  if (type === "working") {
    return Array.from({ length: exSets }, () => ({ weight_kg: "", reps: String(exReps), done: false }));
  }
  if (type === "warmup") {
    return Array.from({ length: 2 }, () => ({ weight_kg: "", reps: String(exReps), done: false }));
  }
  // dropset — starts empty, user adds
  return [];
}

interface OverloadSuggestion {
  weight_kg: number;
  reps: number;
  reason: string; // e.g. "+2.5kg vs sessão anterior"
}

function calcOverload(
  prevSets: { weight_kg: number | null; reps: number; done: boolean; type?: SetType }[],
  targetReps: number,
): OverloadSuggestion | null {
  const working = prevSets.filter((s) => (!s.type || s.type === "working") && s.done && s.weight_kg != null);
  if (working.length === 0) return null;
  const maxWeight = Math.max(...working.map((s) => s.weight_kg as number));
  const avgReps = Math.round(working.reduce((sum, s) => sum + s.reps, 0) / working.length);
  const allCompleted = working.every((s) => s.done);
  if (!allCompleted) return null;

  if (avgReps >= targetReps) {
    // All reps hit → increase weight by 2.5kg
    return { weight_kg: maxWeight + 2.5, reps: targetReps, reason: `+2.5kg vs última sessão` };
  } else if (avgReps >= targetReps - 2) {
    // Close to target → same weight, push for target reps
    return { weight_kg: maxWeight, reps: targetReps, reason: `mesmo peso, ${targetReps} reps` };
  }
  return null;
}

function ExerciseRow({ exercise, dayId, clientId }: { exercise: Exercise; dayId: string; clientId: string }) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [activeTab, setActiveTab] = useState<SetType>("working");
  const [setsMap, setSetsMap] = useState<SetsMap>({
    warmup:  makeDefaultSets("warmup",  exercise.sets, exercise.reps),
    working: makeDefaultSets("working", exercise.sets, exercise.reps),
    dropset: makeDefaultSets("dropset", exercise.sets, exercise.reps),
  });
  const [overload, setOverload] = useState<OverloadSuggestion | null>(null);
  const [lastVolume, setLastVolume] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<{ date: string; maxWeight: number | null; avgReps: number; vol: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasVideo = !!exercise.video_url;

  // Load today's log + last session's log for overload suggestion
  useEffect(() => {
    if (!showLog) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const supabase = createClient();

    // Fetch today + last 5 sessions
    supabase.from("workout_logs")
      .select("sets, logged_at")
      .eq("client_id", clientId)
      .eq("exercise_name", exercise.name)
      .order("logged_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!data?.length) return;

        // Separate today from history
        const todayLog = data.find((d) => d.logged_at === todayStr);
        const prevLog  = data.find((d) => d.logged_at !== todayStr);

        // Progressive overload suggestion from last session
        if (prevLog?.sets) {
          const prevSets = prevLog.sets as { weight_kg: number | null; reps: number; done: boolean; type?: SetType }[];
          const suggestion = calcOverload(prevSets, parseInt(String(exercise.reps)) || 10);
          setOverload(suggestion);

          // Last session working volume
          const vol = prevSets
            .filter((s) => (!s.type || s.type === "working") && s.weight_kg)
            .reduce((sum, s) => sum + (s.weight_kg ?? 0) * s.reps, 0);
          if (vol > 0) setLastVolume(Math.round(vol));
        }

        // Build compact session history (last 3 non-today sessions)
        const recentHistory = data
          .filter((d) => d.logged_at !== todayStr)
          .slice(0, 3)
          .map((s) => {
            const sets = (s.sets ?? []) as { weight_kg: number | null; reps: number; done: boolean; type?: SetType }[];
            const working = sets.filter((w) => (!w.type || w.type === "working") && w.done && w.weight_kg != null);
            const maxWeight = working.length > 0 ? Math.max(...working.map((w) => w.weight_kg as number)) : null;
            const avgReps = working.length > 0 ? Math.round(working.reduce((sum, w) => sum + w.reps, 0) / working.length) : 0;
            const vol = working.reduce((sum, w) => sum + (w.weight_kg ?? 0) * w.reps, 0);
            return { date: s.logged_at, maxWeight, avgReps, vol: Math.round(vol) };
          });
        setSessionHistory(recentHistory);

        // If today's log exists, restore it
        if (todayLog?.sets) {
          const saved = todayLog.sets as { weight_kg: number | null; reps: number; done: boolean; type?: SetType }[];
          const grouped: SetsMap = { warmup: [], working: [], dropset: [] };
          for (const s of saved) {
            const t: SetType = s.type === "warmup" || s.type === "dropset" ? s.type : "working";
            grouped[t].push({
              weight_kg: s.weight_kg != null ? String(s.weight_kg) : "",
              reps: s.reps != null ? String(s.reps) : String(exercise.reps),
              done: s.done ?? false,
            });
          }
          setSetsMap({
            warmup:  grouped.warmup.length  > 0 ? grouped.warmup  : makeDefaultSets("warmup",  exercise.sets, exercise.reps),
            working: grouped.working.length > 0 ? grouped.working : makeDefaultSets("working", exercise.sets, exercise.reps),
            dropset: grouped.dropset,
          });
        }
      });
  }, [showLog, clientId, exercise.name, exercise.sets, exercise.reps]);

  // Apply overload suggestion to working sets (only if sets are still empty)
  function applyOverload() {
    if (!overload) return;
    setSetsMap((prev) => ({
      ...prev,
      working: prev.working.map((s) => ({
        ...s,
        weight_kg: s.weight_kg || String(overload.weight_kg),
        reps: s.reps || String(overload.reps),
      })),
    }));
  }

  function updateSet(type: SetType, i: number, field: keyof SetEntry, value: string | boolean) {
    setSetsMap((prev) => ({
      ...prev,
      [type]: prev[type].map((s, idx) => idx === i ? { ...s, [field]: value } : s),
    }));
  }

  function addSet(type: SetType) {
    setSetsMap((prev) => {
      const existing = prev[type];
      // Dropset: suggest ~10% less than previous set
      const lastWeight = existing.length > 0 ? existing[existing.length - 1].weight_kg : "";
      const suggestedWeight = type === "dropset" && lastWeight
        ? String(Math.round(parseFloat(lastWeight) * 0.9 * 2) / 2) // round to 0.5
        : "";
      return {
        ...prev,
        [type]: [...existing, { weight_kg: suggestedWeight, reps: String(exercise.reps), done: false }],
      };
    });
  }

  function removeSet(type: SetType, i: number) {
    setSetsMap((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== i),
    }));
  }

  async function saveLog() {
    setSaving(true);
    const supabase = createClient();
    const today = new Date();
    const logged_at = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    // Flatten all types into one array with type tag
    const allSets = (["warmup", "working", "dropset"] as SetType[]).flatMap((type) =>
      setsMap[type].map((s) => ({
        type,
        weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : null,
        reps: parseInt(s.reps) || 0,
        done: s.done,
      }))
    );

    const { error } = await supabase.from("workout_logs").upsert({
      client_id: clientId,
      exercise_name: exercise.name,
      day_id: dayId,
      logged_at,
      sets: allSets,
    }, { onConflict: "client_id,exercise_name,logged_at" });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const currentSets = setsMap[activeTab];
  const activeTabMeta = SET_TABS_DEF.find((t) => t.type === activeTab)!;

  // Badge counts (only show for non-empty tabs that aren't active)
  function tabBadge(type: SetType) {
    const done = setsMap[type].filter((s) => s.done).length;
    const total = setsMap[type].length;
    if (total === 0) return null;
    return `${done}/${total}`;
  }

  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{exercise.name}</p>
          {exercise.notes && (
            <p className="text-gray-500 text-xs mt-0.5">{exercise.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-brand-gold font-bold text-sm">{exercise.sets}x</span>
            <span className="text-gray-300 text-sm ml-1">{exercise.reps}</span>
          </div>
          <button
            onClick={() => setShowLog((v) => !v)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs font-bold ${showLog ? "bg-brand-gold text-black" : "bg-zinc-700 text-gray-400 hover:bg-zinc-600"}`}
            title={extra.register_weights[lang]}
          >
            ✎
          </button>
          {hasVideo && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
              title={extra.watch_video_arrow[lang]}
            >
              <span className="text-white text-xs">▶</span>
            </button>
          )}
        </div>
      </div>

      {/* Weight log */}
      {showLog && (
        <div className="mt-3 bg-zinc-800/60 rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-700/60">
            {SET_TABS_DEF.map((tab) => {
              const badge = tabBadge(tab.type);
              const isActive = activeTab === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${
                    isActive
                      ? `${tab.color} bg-zinc-700/40`
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {isActive && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.dotColor}`} />
                  )}
                  {extra[tab.labelKey][lang]}
                  {badge && !isActive && (
                    <span className={`text-[10px] px-1 py-0.5 rounded-full bg-zinc-700 ${tab.color}`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Progressive overload banner + last session volume */}
          {activeTab === "working" && (overload || lastVolume || sessionHistory.length > 0) && (
            <div className="mx-3 mt-3 space-y-2">
              {overload && (
                <button
                  onClick={applyOverload}
                  className="w-full flex items-center justify-between px-3 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-xl hover:bg-brand-gold/15 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-brand-gold text-sm">📈</span>
                    <div className="text-left">
                      <p className="text-brand-gold text-xs font-semibold">{extra.suggestion[lang]} {overload.weight_kg}kg × {overload.reps}</p>
                      <p className="text-zinc-500 text-[10px]">{overload.reason} · {extra.overload_tap[lang]}</p>
                    </div>
                  </div>
                  <span className="text-zinc-600 group-hover:text-brand-gold text-xs transition-colors">↙</span>
                </button>
              )}
              {lastVolume && (
                <p className="text-zinc-600 text-[10px] text-center">
                  {extra.last_vol[lang]} <span className="text-zinc-400 font-medium">{lastVolume.toLocaleString("pt-PT")} kg</span>
                </p>
              )}

              {/* Compact session history */}
              {sessionHistory.length > 0 && (
                <div className="rounded-xl border border-zinc-700/50 overflow-hidden">
                  <div className="px-3 py-1.5 bg-zinc-800/60 border-b border-zinc-700/40">
                    <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide">{extra.recent_sessions[lang]}</p>
                  </div>
                  <div className="divide-y divide-zinc-800/60">
                    {sessionHistory.map((h, i) => {
                      const date = new Date(h.date + "T00:00:00");
                      const label = date.toLocaleDateString(lang === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short" });
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2">
                          <p className="text-zinc-500 text-[11px]">{label}</p>
                          <div className="flex items-center gap-3">
                            {h.maxWeight != null && (
                              <span className="text-zinc-300 text-[11px] font-medium">
                                {h.maxWeight}kg × {h.avgReps}
                              </span>
                            )}
                            {h.vol > 0 && (
                              <span className="text-zinc-600 text-[10px]">
                                {h.vol.toLocaleString("pt-PT")} {extra.vol_suffix[lang]}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sets list */}
          <div className="p-3 space-y-2">
            {/* Empty state for dropset */}
            {currentSets.length === 0 && activeTab === "dropset" && (
              <p className="text-gray-600 text-xs text-center py-2">
                {extra.dropset_hint[lang]}
              </p>
            )}

            {currentSets.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => { haptic(HAPTIC.tap); updateSet(activeTab, i, "done", !s.done); }}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                    s.done ? activeTabMeta.doneColor : "border-zinc-600"
                  }`}
                />
                <span className="text-xs text-gray-500 shrink-0 w-12">
                  {activeTab === "warmup" && `${extra.warmup_set[lang]} ${i + 1}`}
                  {activeTab === "working" && `${extra.series_lbl[lang]} ${i + 1}`}
                  {activeTab === "dropset" && `${extra.drop_lbl[lang]} ${i + 1}`}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={s.weight_kg}
                  onChange={(e) => updateSet(activeTab, i, "weight_kg", e.target.value)}
                  placeholder="kg"
                  className={`w-16 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none transition-colors ${
                    activeTab === "warmup" ? "focus:border-sky-500" :
                    activeTab === "dropset" ? "focus:border-orange-500" :
                    "focus:border-brand-gold"
                  }`}
                />
                <input
                  type="text"
                  value={s.reps}
                  onChange={(e) => updateSet(activeTab, i, "reps", e.target.value)}
                  placeholder="reps"
                  className={`w-14 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none transition-colors ${
                    activeTab === "warmup" ? "focus:border-sky-500" :
                    activeTab === "dropset" ? "focus:border-orange-500" :
                    "focus:border-brand-gold"
                  }`}
                />
                {/* Remove button — always on warmup/dropset, only if >1 set on working */}
                {(activeTab !== "working" || currentSets.length > 1) && (
                  <button
                    onClick={() => removeSet(activeTab, i)}
                    className="w-5 h-5 rounded-full bg-zinc-700 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 flex items-center justify-center text-xs shrink-0 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Add set button */}
            <button
              onClick={() => addSet(activeTab)}
              className={`w-full py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors mt-1 ${
                activeTab === "warmup"   ? "border-sky-700 text-sky-600 hover:border-sky-500 hover:text-sky-400" :
                activeTab === "dropset" ? "border-orange-700 text-orange-600 hover:border-orange-500 hover:text-orange-400" :
                "border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300"
              }`}
            >
              {extra.add_set[lang]}
            </button>

            {/* Save */}
            <button
              onClick={saveLog}
              disabled={saving}
              className={`w-full py-1.5 rounded-lg text-xs font-semibold mt-1 transition-colors ${
                saved ? "bg-green-600 text-white" : "bg-brand-gold hover:bg-brand-gold-dark text-black"
              }`}
            >
              {saving ? extra.saving[lang] : saved ? extra.saved[lang] : extra.save_log[lang]}
            </button>
          </div>
        </div>
      )}

      {/* Video embed */}
      {hasVideo && expanded && (
        <div className="mt-3 rounded-xl overflow-hidden">
          <VideoEmbed url={exercise.video_url!} lang={lang} />
        </div>
      )}
    </div>
  );
}

function VideoEmbed({ url, lang }: { url: string; lang: "pt" | "en" }) {
  const youtubeId = extractYouTubeId(url);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        className="w-full aspect-video rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-gold text-sm hover:underline"
    >
      {extra.watch_video_arrow[lang]}
    </a>
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── Rest Timer ─────────────────────────────────────────────

const PRESETS = [30, 60, 90, 120, 180];

function RestTimer({ onClose }: { onClose: () => void }) {
  const { lang } = useLang();
  const [seconds, setSeconds] = useState(60);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r === null || r <= 1) {
        setRunning(false);
        return 0;
      }
      return r - 1;
    });
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, tick]);

  function start(s: number) {
    setRemaining(s);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setRemaining(null);
  }

  const display = remaining ?? seconds;
  const mins = Math.floor(display / 60);
  const secs = display % 60;
  const done = remaining === 0;

  return (
    <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{extra.rest_timer_title[lang]}</p>
        <button onClick={onClose} className="text-gray-600 hover:text-white text-xs transition-colors">{extra.close_btn[lang]}</button>
      </div>

      {/* Presets */}
      {!running && remaining === null && (
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setSeconds(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                seconds === s ? "bg-brand-gold text-black" : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
              }`}
            >
              {s >= 60 ? `${s / 60}min` : `${s}s`}
            </button>
          ))}
        </div>
      )}

      {/* Display */}
      <div className="text-center">
        <p className={`text-5xl font-black tabular-nums ${done ? "text-green-400" : running ? "text-white" : "text-gray-400"}`}>
          {mins}:{String(secs).padStart(2, "0")}
        </p>
        {done && <p className="text-green-400 text-sm mt-1">{extra.rest_done[lang]}</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running && remaining === null ? (
          <button
            onClick={() => start(seconds)}
            className="flex-1 py-2 bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold rounded-lg transition-colors"
          >
            {extra.start_btn[lang].replace("▶ ", "")}
          </button>
        ) : (
          <>
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {running ? extra.pause_btn[lang] : extra.continue_btn[lang]}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-400 text-sm rounded-lg transition-colors"
            >
              {extra.reset_btn[lang]}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
