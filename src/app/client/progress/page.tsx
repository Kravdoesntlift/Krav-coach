import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProgressTabs, { TimelineEvent } from "./ProgressTabs";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

const extra = {
  consecutive_days:  { pt: "dias seguidos 🔥",  en: "consecutive days 🔥" },
  total_workouts:    { pt: "treinos totais",     en: "total workouts" },
  best_streak:       { pt: "melhor série",       en: "best streak" },
  workout_done_tl:   { pt: "Treino concluído",   en: "Workout done" },
  weekly_checkin_tl: { pt: "Check-in semanal",   en: "Weekly check-in" },
  energy_tl:         { pt: "Energia",            en: "Energy" },
  weight_logged:     { pt: "Peso registado",     en: "Weight logged" },
  vs_prev_week:      { pt: "vs semana anterior", en: "vs previous week" },
  hub_checkin_sub:   { pt: "Semanal",            en: "Weekly" },
  hub_log_label:     { pt: "Registo",            en: "Log" },
  hub_log_sub:       { pt: "Passos & Água",      en: "Steps & Water" },
  hub_history_sub:   { pt: "Treinos",            en: "Workouts" },
  hub_prs_sub:       { pt: "Records",            en: "Records" },
  hub_badges_sub:    { pt: "Badges",             en: "Badges" },
  hub_photos_sub:    { pt: "Progresso",          en: "Progress" },
  hub_report_label:  { pt: "Relatórios",         en: "Reports" },
  hub_report_sub:    { pt: "Mensal",             en: "Monthly" },
  hub_ranking_label: { pt: "Ranking",            en: "Ranking" },
} as const;

export default async function ProgressPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: logs }, { data: checkins }, { data: completions }, { data: prs }, { data: completionDays }] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("*")
      .eq("client_id", user!.id)
      .order("logged_at", { ascending: true }),
    supabase
      .from("weekly_checkins")
      .select("week_start, weight_kg, waist_cm, chest_cm, arm_cm, energy_level")
      .eq("client_id", user!.id)
      .order("week_start", { ascending: true }),
    supabase
      .from("workout_completions")
      .select("created_at")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("personal_records")
      .select("exercise_name, weight_kg, reps, recorded_at")
      .eq("client_id", user!.id)
      .order("recorded_at", { ascending: false })
      .limit(50),
    supabase
      .from("workout_completions")
      .select("created_at, day_id, workout_days(label)")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Group logs by exercise name — compute per-session volume and top set
  const byExercise = new Map<string, { date: string; topSet: number; volume: number; doneSets: number }[]>();
  for (const log of logs ?? []) {
    const sets = (log.sets ?? []) as { weight_kg: number | null; reps: number; done: boolean }[];
    const doneSets = sets.filter((s) => s.done);
    if (doneSets.length === 0) continue;
    const topSet = Math.max(...doneSets.map((s) => s.weight_kg ?? 0));
    // Volume = sum(weight_kg × reps) per session
    const volume = doneSets.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
    const existing = byExercise.get(log.exercise_name) ?? [];
    existing.push({ date: log.logged_at, topSet, volume, doneSets: doneSets.length });
    byExercise.set(log.exercise_name, existing);
  }

  const exercises = Array.from(byExercise.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, points]) => ({ name, points }));

  const measurements = (checkins ?? []).map((c) => ({
    week_start: c.week_start,
    weight_kg: c.weight_kg ?? null,
    waist_cm: (c as Record<string, unknown>).waist_cm as number ?? null,
    chest_cm: (c as Record<string, unknown>).chest_cm as number ?? null,
    arm_cm:   (c as Record<string, unknown>).arm_cm as number ?? null,
  }));

  // Streak calculation
  const completedDates = [...new Set(
    (completions ?? []).map((c) => (c.created_at as string).slice(0, 10))
  )].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  for (let i = completedDates.length - 1; i >= 0; i--) {
    const d = completedDates[i];
    if (i === completedDates.length - 1) {
      if (d === today || d === yesterday) streak = 1; else break;
    } else {
      const prev = new Date(completedDates[i + 1]);
      const cur = new Date(d);
      const diff = Math.round((prev.getTime() - cur.getTime()) / 86400000);
      if (diff === 1) streak++; else break;
    }
  }
  currentStreak = streak;
  // Longest streak
  let tempStreak = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const cur = new Date(completedDates[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); }
    else tempStreak = 1;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // ─── Build timeline ────────────────────────────────────────────────────────
  const timelineEvents: TimelineEvent[] = [];

  // Workout completions
  for (const c of completionDays ?? []) {
    const date = (c.created_at as string).slice(0, 10);
    const dayLabel = (c as Record<string, unknown>).workout_days
      ? ((c as Record<string, unknown>).workout_days as Record<string, unknown> | null)?.label as string | undefined
      : undefined;
    timelineEvents.push({
      type: "workout",
      date,
      label: extra.workout_done_tl[lang],
      sub: dayLabel ?? undefined,
    });
  }

  // Personal records
  for (const pr of prs ?? []) {
    timelineEvents.push({
      type: "pr",
      date: (pr.recorded_at as string).slice(0, 10),
      label: pr.exercise_name as string,
      value: pr.weight_kg != null ? `${pr.weight_kg}kg` : undefined,
      sub: pr.reps != null ? `×${pr.reps}` : undefined,
      positive: true,
    });
  }

  // Weekly check-ins + weight events
  const checkinsAsc = [...(checkins ?? [])].sort((a, b) =>
    (a.week_start as string).localeCompare(b.week_start as string)
  );
  for (let i = 0; i < checkinsAsc.length; i++) {
    const c = checkinsAsc[i];
    const energyLevel = (c as Record<string, unknown>).energy_level as number | null | undefined;
    timelineEvents.push({
      type: "checkin",
      date: c.week_start as string,
      label: extra.weekly_checkin_tl[lang],
      sub: energyLevel != null ? `${extra.energy_tl[lang]}: ${energyLevel}/5` : undefined,
    });

    if (c.weight_kg != null) {
      const prevWeight = i > 0 ? checkinsAsc[i - 1].weight_kg : null;
      const diff = prevWeight != null ? +(Number(c.weight_kg) - Number(prevWeight)).toFixed(1) : null;
      const positive = diff != null ? diff < 0 : undefined;
      timelineEvents.push({
        type: "weight",
        date: c.week_start as string,
        label: extra.weight_logged[lang],
        value: `${c.weight_kg}kg`,
        sub: diff != null && diff !== 0 ? `${diff > 0 ? "+" : ""}${diff}kg ${extra.vs_prev_week[lang]}` : undefined,
        positive,
      });
    }
  }

  // Sort descending by date
  timelineEvents.sort((a, b) => b.date.localeCompare(a.date));

  const hubLinks = [
    { href: "/client/checkin",      emoji: "📋", label: t("nav_checkin", lang).replace("📋 ", ""),    sub: extra.hub_checkin_sub[lang] },
    { href: "/client/daily-log",    emoji: "🔥", label: extra.hub_log_label[lang],                    sub: extra.hub_log_sub[lang] },
    { href: "/client/history",      emoji: "📅", label: t("history", lang),                           sub: extra.hub_history_sub[lang] },
    { href: "/client/records",      emoji: "🏆", label: "PRs",                                        sub: extra.hub_prs_sub[lang] },
    { href: "/client/achievements", emoji: "⭐", label: t("achievements", lang),                      sub: extra.hub_badges_sub[lang] },
    { href: "/client/photos",       emoji: "📸", label: t("nav_photos", lang).replace("📸 ", ""),     sub: extra.hub_photos_sub[lang] },
    { href: "/client/report",       emoji: "📊", label: extra.hub_report_label[lang],                 sub: extra.hub_report_sub[lang] },
    { href: "/client/leaderboard",  emoji: "🥇", label: extra.hub_ranking_label[lang],                sub: "Leaderboard" },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Quick-access hub */}
      <div className="grid grid-cols-4 gap-2">
        {hubLinks.map(({ href, emoji, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors text-center"
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-white text-[11px] font-semibold leading-tight">{label}</span>
            <span className="text-zinc-600 text-[10px] leading-tight">{sub}</span>
          </Link>
        ))}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-zinc-800">
          <p className="text-2xl font-black text-white">{currentStreak}</p>
          <p className="text-zinc-500 text-[11px] mt-0.5">{extra.consecutive_days[lang]}</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-zinc-800">
          <p className="text-2xl font-black text-white">{completedDates.length}</p>
          <p className="text-zinc-500 text-[11px] mt-0.5">{extra.total_workouts[lang]}</p>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-zinc-800">
          <p className="text-2xl font-black text-white">{longestStreak}</p>
          <p className="text-zinc-500 text-[11px] mt-0.5">{extra.best_streak[lang]}</p>
        </div>
      </div>

      {/* Detailed tabs (charts, timeline, measurements) */}
      <ProgressTabs
        exercises={exercises as { name: string; points: { date: string; topSet: number; volume: number; doneSets: number }[] }[]}
        measurements={measurements}
        completedDates={completedDates}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalWorkouts={completedDates.length}
        timeline={timelineEvents}
      />
    </div>
  );
}
