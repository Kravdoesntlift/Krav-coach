import { createClient } from "@/lib/supabase/server";
import { computeAchievements, CATEGORY_META, type AchievementCategory } from "@/lib/achievements";
import AchievementCategorySection from "@/components/client/AchievementCategory";
import AchievementUnlockModal from "@/components/client/AchievementUnlockModal";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: plans },
    { data: checkins },
    { data: records },
    { data: profile },
    { data: logs },
    { data: photos },
  ] = await Promise.all([
    supabase.from("workout_plans")
      .select("week_start, workout_days(is_rest, workout_completions(client_id))")
      .eq("client_id", user!.id)
      .order("week_start", { ascending: false }),
    supabase.from("weekly_checkins").select("id").eq("client_id", user!.id),
    supabase.from("personal_records").select("exercise_name").eq("client_id", user!.id),
    supabase.from("profiles").select("full_name, seen_achievements").eq("id", user!.id).single(),
    supabase.from("workout_logs").select("sets").eq("client_id", user!.id),
    supabase.from("progress_photos").select("id").eq("client_id", user!.id),
  ]);

  // ── Stats ──────────────────────────────────────────────────────
  let streak = 0, totalWeeksWithCompletion = 0, hasPerfectWeek = false;
  let totalWorkouts = 0, perfectWeeks = 0;

  for (const p of plans ?? []) {
    const days = p.workout_days as { is_rest?: boolean; workout_completions: { client_id: string }[] }[];
    const trainDays = days.filter((d) => !d.is_rest);
    const completed = trainDays.filter((d) => d.workout_completions?.some((c) => c.client_id === user!.id)).length;
    totalWorkouts += completed;
    if (completed > 0) {
      totalWeeksWithCompletion++;
      if (completed === trainDays.length && trainDays.length > 0) { hasPerfectWeek = true; perfectWeeks++; }
    }
  }
  for (const p of plans ?? []) {
    const days = p.workout_days as { is_rest?: boolean; workout_completions: { client_id: string }[] }[];
    const hasAny = days.some((d) => !d.is_rest && d.workout_completions?.some((c) => c.client_id === user!.id));
    if (hasAny) streak++; else break;
  }

  const uniquePRExercises = new Set(records?.map((r) => r.exercise_name) ?? []).size;

  let totalVolumeKg = 0;
  for (const log of logs ?? []) {
    for (const s of (log.sets as { weight_kg?: number; reps?: number; done: boolean }[]) ?? []) {
      if (s.done && s.weight_kg && s.reps) totalVolumeKg += s.weight_kg * s.reps;
    }
  }

  const achievements = computeAchievements({
    totalWeeksWithCompletion, streak,
    totalCheckins: checkins?.length ?? 0,
    totalPRs: uniquePRExercises,
    hasPerfectWeek, totalWorkouts, totalVolumeKg, perfectWeeks,
    totalPhotos: photos?.length ?? 0,
  });

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalPct = Math.round((totalUnlocked / achievements.length) * 100);

  // ── Group by category ─────────────────────────────────────────
  const categoryOrder: AchievementCategory[] = [
    "primeiros_passos", "consistencia", "recordes", "volume_kg", "total_treinos",
  ];
  const byCategory = Object.fromEntries(
    categoryOrder.map((cat) => [cat, achievements.filter((a) => a.category === cat)])
  ) as Record<AchievementCategory, typeof achievements>;

  return (
    <div className="page-enter space-y-6 pb-8">

      {/* ── Unlock celebration modal (client) ── */}
      <AchievementUnlockModal achievements={achievements} seenAchievements={profile?.seen_achievements ?? []} />

      {/* ── Hero header ── */}
      <div className="space-y-3">
        <p className="text-zinc-600 text-xs font-semibold tracking-[0.15em] uppercase">As tuas conquistas</p>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {totalUnlocked} <span className="text-zinc-600">/ {achievements.length}</span>
        </h1>

        {/* Global progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width:`${totalPct}%`, background:"linear-gradient(90deg,#A8893A,#C9A84C,#E2C060)" }}
            />
          </div>
          <span className="text-xs font-bold text-brand-gold tabular-nums">{totalPct}%</span>
        </div>
      </div>

      {/* ── Categories ── */}
      {categoryOrder.map((cat) => (
        <AchievementCategorySection
          key={cat}
          cat={cat}
          meta={CATEGORY_META[cat]}
          items={byCategory[cat]}
          clientName={profile?.full_name ?? ""}
        />
      ))}
    </div>
  );
}
