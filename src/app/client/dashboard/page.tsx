import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DAY_NAMES_FULL } from "@/lib/supabase/types";
import type { WorkoutPlan } from "@/lib/supabase/types";
import WorkoutWeek from "@/components/client/WorkoutWeek";
import TodayCard from "@/components/client/TodayCard";
import CollapsibleMuscleMap from "@/components/client/CollapsibleMuscleMap";
import DashboardOverlays from "@/components/client/DashboardOverlays";
import WeeklySummary from "@/components/client/WeeklySummary";
import MonthlyReport from "@/components/client/MonthlyReport";
import CoachFeedbackBanner from "@/components/client/CoachFeedbackBanner";
import ChallengeCards from "@/components/client/ChallengeCards";
import ClientGoals from "@/components/client/ClientGoals";
import OnboardingWrapper from "@/components/client/OnboardingWrapper";
import InstallPrompt from "@/components/client/InstallPrompt";
import NotificationPrompt from "@/components/client/NotificationPrompt";
import AppBadge from "@/components/client/AppBadge";

import type { WeeklyCheckin } from "@/lib/supabase/types";
import MonthCalendar, { type DayStatus } from "@/components/client/MonthCalendar";
import { computeAchievements } from "@/lib/achievements";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const today = new Date();
  const currentHour = today.getHours(); // capture before any mutation
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth()+1).padStart(2,"0")}-${String(today.getUTCDate()).padStart(2,"0")}`;
  const dayOfWeek = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  // Fetch plans with day info for streak + calendar
  const { data: allPlans } = await supabase
    .from("workout_plans")
    .select("week_start, workout_days(day_of_week, is_rest, workout_completions(client_id))")
    .eq("client_id", user!.id)
    .order("week_start", { ascending: false })
    .limit(26); // ~6 months

  // Build date → status map (used for both streak and calendar)
  type PlanDay = { day_of_week: number; is_rest?: boolean; workout_completions: { client_id: string }[] };
  const dayStatuses: Record<string, DayStatus> = {};
  for (const plan of allPlans ?? []) {
    const ws = new Date(plan.week_start + "T00:00:00Z");
    for (const d of (plan.workout_days as PlanDay[])) {
      const offset  = (d.day_of_week + 6) % 7;
      const dt      = new Date(ws);
      dt.setUTCDate(ws.getUTCDate() + offset);
      const ds = dt.toISOString().split("T")[0];
      const done = d.workout_completions?.some(c => c.client_id === user!.id) ?? false;
      dayStatuses[ds] =
        d.is_rest           ? "rest"      :
        done                ? "completed" :
        ds > todayStr       ? "future"    :
                              "missed";
    }
  }

  // Daily streak: consecutive completed training days (rest days skipped, today excused if not done yet)
  let streak = 0;
  for (const ds of Object.keys(dayStatuses).sort().reverse()) {
    const s = dayStatuses[ds];
    if (s === "rest" || s === "future") continue;
    if (s === "completed") { streak++; continue; }
    if (ds === todayStr) continue; // today not done yet — don't break
    break;
  }

  // End of this week (Sunday)
  const weekEnd = new Date(monday);
  weekEnd.setUTCDate(monday.getUTCDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const [{ data: planThisWeek }, { data: feedback }, { data: clientProfile }, { data: currentCheckin }, { data: fullProfile }, { data: weekChallenges }, { data: challengeProgress }, { data: clientGoals }, { data: onboardingRecord }, { data: weekLogs }, { data: allCheckins }, { data: allRecords }, { data: allLogs }, { data: allPhotos }, { data: latestWeeklyReport }] = await Promise.all([
    supabase
      .from("workout_plans")
      .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
      .eq("client_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("coach_feedback")
      .select("message, created_at")
      .eq("client_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, tagline, welcomed_at, seen_achievements").eq("id", user!.id).single(),
    supabase.from("weekly_checkins").select("*").eq("client_id", user!.id).eq("week_start", weekStart).maybeSingle(),
    supabase.from("profiles").select("subscription_renews_at").eq("id", user!.id).single(),
    supabase.from("challenges").select("*").eq("client_id", user!.id).eq("week_start", weekStart),
    supabase.from("challenge_progress").select("*").eq("client_id", user!.id),
    supabase.from("client_goals").select("*").eq("client_id", user!.id).eq("completed", false).order("created_at"),
    supabase.from("client_onboarding").select("client_id").eq("client_id", user!.id).maybeSingle(),
    supabase.from("workout_logs").select("exercise_name").eq("client_id", user!.id)
      .gte("logged_at", weekStart).lte("logged_at", weekEndStr),
    supabase.from("weekly_checkins").select("id").eq("client_id", user!.id),
    supabase.from("personal_records").select("exercise_name").eq("client_id", user!.id),
    supabase.from("workout_logs").select("sets").eq("client_id", user!.id),
    supabase.from("progress_photos").select("id").eq("client_id", user!.id),
    supabase.from("weekly_reports").select("id, week_start").eq("client_id", user!.id)
      .order("week_start", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Fallback: if no plan for this week, show the most recent plan
  let plan = planThisWeek;
  let isCurrentWeek = true;
  if (!plan) {
    const { data: latestPlan } = await supabase
      .from("workout_plans")
      .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
      .eq("client_id", user!.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    plan = latestPlan;
    isCurrentWeek = false;
  }

  // Get coach info — from plan first, then from explicit assignment (coach_clients)
  let coachId: string | null | undefined = plan?.coach_id ?? null;
  if (!coachId) {
    const { data: assignment } = await supabase
      .from("coach_clients")
      .select("coach_id")
      .eq("client_id", user!.id)
      .eq("assigned_role", "coach")
      .maybeSingle();
    coachId = assignment?.coach_id ?? null;
  }
  const { data: coachProfile } = coachId
    ? await supabase.from("profiles").select("id, full_name, tagline").eq("id", coachId).single()
    : { data: null };

  const todayName = DAY_NAMES_FULL[today.getDay()];

  // All exercise names this week (for muscle map) — from plan
  const weekExerciseNames = plan
    ? (plan.workout_days as WorkoutPlan["workout_days"])
        ?.flatMap((d) => (d.exercises ?? []).map((e: { name: string }) => e.name)) ?? []
    : [];

  // Exercises actually logged this week (drives "done" state on muscle map)
  const weekLoggedNames = (weekLogs ?? []).map((l) => l.exercise_name as string);

  // Find today's workout day
  const todayDow = today.getDay();
  const todayDay = plan
    ? (plan.workout_days as WorkoutPlan["workout_days"])
        ?.find((d) => d.day_of_week === todayDow)
    : null;
  const trainDays = plan
    ? (plan.workout_days as WorkoutPlan["workout_days"])?.filter((d) => !d.is_rest) ?? []
    : [];
  const completedDays = trainDays.filter((d) =>
    d.workout_completions?.some((c: { client_id: string }) => c.client_id === user!.id)
  ).length;
  const todayCompleted = !!todayDay?.workout_completions?.some(
    (c: { client_id: string }) => c.client_id === user!.id
  );

  // Payment countdown
  const renewsAt = fullProfile?.subscription_renews_at ?? null;
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const daysUntilRenewal = renewsAt
    ? Math.ceil((new Date(renewsAt + "T00:00:00").getTime() - todayMidnight.getTime()) / 86400000)
    : null;
  const isFirstOfMonth = today.getDate() === 1;

  // Monthly report data (only computed on 1st of month)
  let monthlyData = null;
  if (isFirstOfMonth) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lmStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth()+1).padStart(2,"0")}-01`;
    const lmEnd = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth()+1).padStart(2,"0")}-${String(lastMonthEnd.getDate()).padStart(2,"0")}`;

    const [{ data: lmCompletions }, { data: lmPRs }, { data: lmCheckins }] = await Promise.all([
      supabase.from("workout_completions").select("id, workout_days(workout_plans(client_id))")
        .gte("completed_at", lmStart).lte("completed_at", lmEnd),
      supabase.from("personal_records").select("id").eq("client_id", user!.id)
        .gte("recorded_at", lmStart).lte("recorded_at", lmEnd),
      supabase.from("weekly_checkins").select("weight_kg, week_start").eq("client_id", user!.id)
        .gte("week_start", lmStart).lte("week_start", lmEnd).order("week_start"),
    ]);

    const totalWorkouts = lmCompletions?.length ?? 0;
    const totalPRs = lmPRs?.length ?? 0;
    const checkins = lmCheckins ?? [];
    const weights = checkins.map((c) => c.weight_kg).filter(Boolean) as number[];
    const weightChange = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;
    const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    monthlyData = {
      month: MONTH_NAMES[lastMonth.getMonth()],
      year: lastMonth.getFullYear(),
      totalWorkouts,
      totalPRs,
      weightChange,
      totalCheckins: checkins.length,
    };
  }

  const greeting = currentHour < 5 ? "Boa noite" : currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (clientProfile?.full_name ?? "").split(" ")[0] || "Atleta";

  const isOnboardingComplete = !!onboardingRecord;

  // Compute achievements for unlock modal
  let achStreak = 0, achTotalWeeks = 0, achHasPerfect = false, achTotalWorkouts = 0, achPerfectWeeks = 0;
  for (const p of allPlans ?? []) {
    const days = p.workout_days as { is_rest?: boolean; workout_completions: { client_id: string }[] }[];
    const trainDays = days.filter((d) => !d.is_rest);
    const completed = trainDays.filter((d) => d.workout_completions?.some((c) => c.client_id === user!.id)).length;
    achTotalWorkouts += completed;
    if (completed > 0) {
      achTotalWeeks++;
      if (completed === trainDays.length && trainDays.length > 0) { achHasPerfect = true; achPerfectWeeks++; }
    }
  }
  for (const p of allPlans ?? []) {
    const days = p.workout_days as { is_rest?: boolean; workout_completions: { client_id: string }[] }[];
    const hasAny = days.some((d) => !d.is_rest && d.workout_completions?.some((c) => c.client_id === user!.id));
    if (hasAny) achStreak++; else break;
  }
  const uniquePRExercises = new Set(allRecords?.map((r) => r.exercise_name) ?? []).size;
  let achVolumeKg = 0;
  for (const log of allLogs ?? []) {
    for (const s of (log.sets as { weight_kg?: number; reps?: number; done: boolean }[]) ?? []) {
      if (s.done && s.weight_kg && s.reps) achVolumeKg += s.weight_kg * s.reps;
    }
  }
  const achievements = computeAchievements({
    totalWeeksWithCompletion: achTotalWeeks,
    streak: achStreak,
    totalCheckins: allCheckins?.length ?? 0,
    totalPRs: uniquePRExercises,
    hasPerfectWeek: achHasPerfect,
    totalWorkouts: achTotalWorkouts,
    totalVolumeKg: achVolumeKg,
    perfectWeeks: achPerfectWeeks,
    totalPhotos: allPhotos?.length ?? 0,
  });

  return (
    <>
      <AppBadge userId={user!.id} />
      <NotificationPrompt />
      <OnboardingWrapper clientId={user!.id} isComplete={isOnboardingComplete} />
      <DashboardOverlays
        clientName={clientProfile?.full_name ?? ""}
        coachName={coachProfile?.full_name ?? ""}
        coachTagline={coachProfile?.tagline}
        coachId={coachProfile?.id ?? null}
        welcomed={!!clientProfile?.welcomed_at}
        achievements={achievements}
        seenAchievements={clientProfile?.seen_achievements ?? []}
      />
    <div className="space-y-4 md:space-y-6 page-enter">
      {/* Hero header */}
      <div className="space-y-2 md:space-y-3 pt-1">
        <p className="text-zinc-600 text-xs font-semibold tracking-[0.15em] uppercase">
          {todayName} · {today.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
        </p>
        <h1 className="text-[1.75rem] md:text-[2.1rem] font-black tracking-tight leading-[1.1]">
          {greeting},{" "}
          <span className="text-gold-gradient">{firstName}</span>
        </h1>
        {streak > 0 && (
          <div className="inline-flex items-center gap-2 bg-brand-gold/8 border border-brand-gold/18 rounded-full pl-2 pr-3.5 py-1.5 glow-gold-sm float">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >🔥</span>
            <span className="text-brand-gold font-black text-sm tabular-nums">{streak}</span>
            <span className="text-brand-gold/55 text-xs font-medium">
              {streak === 1 ? "sessão seguida" : "sessões seguidas"}
            </span>
          </div>
        )}
      </div>

      {/* Install app prompt */}
      <InstallPrompt />

      {/* Payment countdown — only when ≤ 7 days */}
      {daysUntilRenewal !== null && daysUntilRenewal <= 7 && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
          daysUntilRenewal <= 0
            ? "border-red-500/30 bg-red-500/5"
            : daysUntilRenewal <= 3
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-zinc-700 bg-zinc-900"
        }`}>
          <div>
            <p className={`text-sm font-medium ${
              daysUntilRenewal <= 0 ? "text-red-400" : daysUntilRenewal <= 3 ? "text-yellow-400" : "text-gray-300"
            }`}>
              {daysUntilRenewal <= 0
                ? "Renovação em atraso"
                : daysUntilRenewal === 1
                ? "Renovação amanhã"
                : `Renovação em ${daysUntilRenewal} dias`}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">
              {new Date(renewsAt! + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
            </p>
          </div>
          <span className={`text-2xl font-black tabular-nums ${
            daysUntilRenewal <= 0 ? "text-red-400" : daysUntilRenewal <= 3 ? "text-yellow-400" : "text-gray-500"
          }`}>
            {daysUntilRenewal <= 0 ? "!" : `D-${daysUntilRenewal}`}
          </span>
        </div>
      )}

      {/* Monthly report (1st of month) */}
      {monthlyData && <MonthlyReport {...monthlyData} />}

      {/* Weekly AI report card */}
      {latestWeeklyReport && (
        <Link href="/client/weekly-report" className="block">
          <div
            className="rounded-2xl px-4 py-3.5 flex items-center gap-3 border transition-all active:scale-[0.98]"
            style={{
              background: "rgba(18,18,20,0.85)",
              borderColor: "rgba(201,168,76,0.22)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))" }}
            >
              📊
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Ver relatório desta semana</p>
              <p className="text-zinc-500 text-xs mt-0.5 truncate">
                Treinos, métricas e mensagem do coach
              </p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      )}

      {/* TODAY CARD — hero do dia */}
      {plan && todayDay && !todayDay.is_rest && (
        <TodayCard
          day={todayDay as Parameters<typeof TodayCard>[0]["day"]}
          clientId={user!.id}
          isCompleted={todayCompleted}
          completedCount={completedDays}
          totalCount={trainDays.length}
        />
      )}

      {/* REST DAY CARD */}
      {plan && todayDay?.is_rest && (
        <div
          className="rounded-2xl p-4 flex items-center gap-4 border border-zinc-800/60"
          style={{ background: "rgba(18,18,20,0.85)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "rgba(39,39,42,0.8)" }}
          >
            💤
          </div>
          <div>
            <p className="text-white font-bold text-sm">Dia de descanso</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {todayDay.label ? todayDay.label : "Recupera bem — o músculo cresce no descanso"}
            </p>
          </div>
        </div>
      )}

      {/* NO PLAN STATE — hero */}
      {!plan && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4 border border-zinc-800/40"
          style={{ background: "rgba(18,18,20,0.85)" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
            🏋
          </div>
          <div>
            <p className="text-white font-bold text-sm">Sem plano esta semana</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              O teu coach ainda não criou o plano — fala com ele se tiveres dúvidas
            </p>
          </div>
        </div>
      )}

      {/* Monthly calendar — always visible */}
      <MonthCalendar
        year={today.getUTCFullYear()}
        month={today.getUTCMonth()}
        dayStatuses={dayStatuses}
        todayStr={todayStr}
      />

      {/* Coach feedback banner */}
      {feedback?.message && (
        <CoachFeedbackBanner message={feedback.message} weekStart={weekStart} />
      )}

      {/* Muscle map — collapsible */}
      <CollapsibleMuscleMap exerciseNames={weekExerciseNames} loggedNames={weekLoggedNames} />

      {/* Goals */}
      {clientGoals && clientGoals.length > 0 && (
        <ClientGoals goals={clientGoals as Parameters<typeof ClientGoals>[0]["goals"]} />
      )}

      {/* Weekly challenges */}
      {weekChallenges && weekChallenges.length > 0 && (
        <ChallengeCards
          challenges={weekChallenges}
          progress={challengeProgress ?? []}
          clientId={user!.id}
        />
      )}

      {/* Weekly summary (Sundays only) */}
      <WeeklySummary
        plan={plan as unknown as WorkoutPlan ?? null}
        checkin={currentCheckin as WeeklyCheckin ?? null}
        clientId={user!.id}
        weekStart={weekStart}
      />

      {/* Workout week — collapsible, só quando há plano */}
      {plan && (
        <>
          {!isCurrentWeek && (
            <div className="text-xs text-gray-500 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
              A mostrar o plano mais recente — o teu coach ainda não criou o plano desta semana.
            </div>
          )}
          <WorkoutWeek plan={plan as unknown as WorkoutPlan} clientId={user!.id} coachId={coachId ?? undefined} />
        </>
      )}
    </div>
    </>
  );
}
