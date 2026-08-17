import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DAY_NAMES_FULL } from "@/lib/supabase/types";
import type { WorkoutPlan } from "@/lib/supabase/types";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";
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
import SetupChecklist from "@/components/client/SetupChecklist";
import InstallPrompt from "@/components/client/InstallPrompt";
import NotificationPrompt from "@/components/client/NotificationPrompt";
import AppBadge from "@/components/client/AppBadge";
import RestDayCard from "@/components/client/RestDayCard";
import WorkoutCacheWriter from "@/components/client/WorkoutCacheWriter";

import type { WeeklyCheckin } from "@/lib/supabase/types";
import MonthCalendar, { type DayStatus } from "@/components/client/MonthCalendar";
import { computeAchievements } from "@/lib/achievements";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const lang = await getLang();

  const today = new Date();
  const currentHour = today.getHours(); // capture before any mutation
  const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth()+1).padStart(2,"0")}-${String(today.getUTCDate()).padStart(2,"0")}`;
  const dayOfWeek = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  // End of this week (Sunday) — computed before queries, no DB dependency
  const weekEnd = new Date(monday);
  weekEnd.setUTCDate(monday.getUTCDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // ── PHASE 1: All independent queries in one parallel batch ────────────────
  // Previously: allPlans ran alone, then 15 queries, then nutrition + testimonial
  // = 3 sequential round-trips. Now everything is one round-trip.
  // allLogs (sets JSON) and allPhotos removed from critical path — their
  // achievement badges now trigger only from the dedicated achievements page.
  const [
    { data: allPlans },
    { data: planThisWeek },
    { data: feedback },
    { data: mergedProfile },
    { data: currentCheckin },
    { data: weekChallenges },
    { data: challengeProgress },
    { data: clientGoals },
    { data: onboardingRecord },
    { data: weekLogs },
    { data: allCheckins },
    { data: allRecords },
    { data: anyNutritionLog },
    { data: pendingTestimonial },
    { data: latestWeeklyReport },
    { data: manualWorkouts },
  ] = await Promise.all([
    // 6-month history (streak + calendar)
    supabase
      .from("workout_plans")
      .select("week_start, workout_days(day_of_week, is_rest, workout_completions(client_id))")
      .eq("client_id", user!.id)
      .order("week_start", { ascending: false })
      .limit(26),
    // This week's full plan (TodayCard + WorkoutWeek)
    supabase
      .from("workout_plans")
      .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
      .eq("client_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    // Coach feedback this week
    supabase
      .from("coach_feedback")
      .select("message, created_at")
      .eq("client_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    // Profile — merged into one query (was two separate queries to same table)
    supabase.from("profiles")
      .select("full_name, tagline, welcomed_at, seen_achievements, avatar_url, subscription_renews_at")
      .eq("id", user!.id)
      .single(),
    // Check-in this week
    supabase.from("weekly_checkins").select("*").eq("client_id", user!.id).eq("week_start", weekStart).maybeSingle(),
    // Challenges & goals
    supabase.from("challenges").select("*").eq("client_id", user!.id).eq("week_start", weekStart),
    supabase.from("challenge_progress").select("*").eq("client_id", user!.id),
    supabase.from("client_goals").select("*").eq("client_id", user!.id).eq("completed", false).order("created_at"),
    // Onboarding
    supabase.from("client_onboarding").select("client_id").eq("client_id", user!.id).maybeSingle(),
    // Exercises logged this week (muscle map)
    supabase.from("workout_logs").select("exercise_name").eq("client_id", user!.id)
      .gte("logged_at", weekStart).lte("logged_at", weekEndStr),
    // Achievement counters (lightweight — just IDs/names)
    supabase.from("weekly_checkins").select("id").eq("client_id", user!.id),
    supabase.from("personal_records").select("exercise_name").eq("client_id", user!.id),
    // Setup checklist + testimonial (was sequential after Promise.all)
    supabase.from("nutrition_logs").select("id").eq("client_id", user!.id).limit(1).maybeSingle(),
    supabase.from("testimonials").select("id").eq("client_id", user!.id)
      .not("requested_at", "is", null).is("submitted_at", null).limit(1).maybeSingle(),
    // Latest weekly report link
    supabase.from("weekly_reports").select("id, week_start").eq("client_id", user!.id)
      .order("week_start", { ascending: false }).limit(1).maybeSingle(),
    // Manual workouts (own sessions) — for streak + calendar overlay
    supabase.from("client_workouts").select("date").eq("client_id", user!.id)
      .order("date", { ascending: false }).limit(200),
  ]);

  // Unpack merged profile (downstream code uses both names)
  const clientProfile = mergedProfile;
  const fullProfile   = mergedProfile;

  // Build date → status map (streak + calendar) — computed after allPlans resolves
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
        // Today is still open — you haven't missed a session you can still do.
        // Marking it missed reset the streak to zero every training-day morning
        // and painted today red on the calendar before the day was over.
        ds >= todayStr      ? "future"    :
                              "missed";
    }
  }

  // Overlay manual workouts — any day with a self-logged workout counts as completed
  for (const w of manualWorkouts ?? []) {
    const d = w.date as string;
    if (!dayStatuses[d] || dayStatuses[d] === "missed") {
      dayStatuses[d] = "completed";
    }
  }

  // Daily streak — rest days are free passes, missed training days break it
  let streak = 0;
  for (const ds of Object.keys(dayStatuses).sort().reverse()) {
    const s = dayStatuses[ds];
    if (s === "rest" || s === "future") continue;
    if (s === "completed") { streak++; continue; }
    break; // "missed" always breaks — including today
  }

  // Fallback: if no plan for this week, show the most recent plan
  let plan = planThisWeek;
  let isCurrentWeek = true;
  if (!plan) {
    const { data: latestPlan } = await supabase
      .from("workout_plans")
      .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
      .eq("client_id", user!.id)
      .lte("week_start", weekStart)
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

  const DAY_NAMES_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = lang === "en" ? DAY_NAMES_EN[today.getDay()] : DAY_NAMES_FULL[today.getDay()];

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
  const todayHasManualWorkout = (manualWorkouts ?? []).some((w) => (w.date as string) === todayStr);
  const todayCompleted = todayHasManualWorkout || !!todayDay?.workout_completions?.some(
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
    const MONTH_NAMES = lang === "en"
      ? ["January","February","March","April","May","June","July","August","September","October","November","December"]
      : ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    monthlyData = {
      month: MONTH_NAMES[lastMonth.getMonth()],
      year: lastMonth.getFullYear(),
      totalWorkouts,
      totalPRs,
      weightChange,
      totalCheckins: checkins.length,
    };
  }

  const greeting = currentHour < 5 ? t("good_evening", lang) : currentHour < 12 ? t("good_morning", lang) : currentHour < 18 ? t("good_afternoon", lang) : t("good_evening", lang);
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
  // achVolumeKg and totalPhotos not computed here (those queries were removed from the
  // dashboard critical path). Volume/photo badges still unlock on the achievements page.
  const achievements = computeAchievements({
    totalWeeksWithCompletion: achTotalWeeks,
    streak: achStreak,
    totalCheckins: allCheckins?.length ?? 0,
    totalPRs: uniquePRExercises,
    hasPerfectWeek: achHasPerfect,
    totalWorkouts: achTotalWorkouts,
    totalVolumeKg: 0,
    perfectWeeks: achPerfectWeeks,
    totalPhotos: 0,
  }, lang);

  // Build cache payload for offline page
  const weekDaysCache = plan
    ? (plan.workout_days as WorkoutPlan["workout_days"])
        ?.sort((a, b) => a.day_of_week - b.day_of_week)
        .map((d) => ({
          label: d.label ?? "",
          exercises: (d.exercises ?? []).map((e: { name: string }) => e.name),
          isRest: !!d.is_rest,
        })) ?? []
    : [];
  const todayExNames = (todayDay?.exercises ?? []).map((e: { name: string }) => e.name);

  // next training day (used by RestDayCard)
  const nextTrainingDay = (() => {
    if (!plan) return null;
    const days = (plan.workout_days as WorkoutPlan["workout_days"]) ?? [];
    const trainDow = days.filter((d) => !d.is_rest).map((d) => d.day_of_week);
    const DAY_SHORT = lang === "en"
      ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      : ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    for (let i = 1; i <= 7; i++) {
      const d = (today.getDay() + i) % 7;
      if (trainDow.includes(d)) return DAY_SHORT[d];
    }
    return null;
  })();

  return (
    <>
      {/* ── Invisible helpers ── */}
      <WorkoutCacheWriter
        todayLabel={todayDay?.label ?? null}
        todayExercises={todayExNames}
        todayIsRest={!!todayDay?.is_rest}
        weekDays={weekDaysCache}
      />
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

      <div className="space-y-4 md:space-y-5 page-enter">

        {/* ── 1. GREETING ── compact, sets the tone */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <p className="text-zinc-600 text-[10px] font-semibold tracking-[0.18em] uppercase">
              {todayName} · {today.toLocaleDateString(lang === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "long" })}
            </p>
            <h1 className="text-[1.6rem] md:text-[2rem] font-black tracking-tight leading-[1.1]">
              {greeting}, <span className="text-gold-gradient">{firstName}</span>
            </h1>
          </div>

          {/* Right side: streak + weekly progress */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Weekly workouts pill — only show if there's a plan */}
            {plan && trainDays.length > 0 && (
              <div className="flex items-center gap-1 rounded-full px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {Array.from({ length: trainDays.length }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: i < completedDays ? "#C9A84C" : "rgba(255,255,255,0.12)" }}
                  />
                ))}
              </div>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-brand-gold/8 border border-brand-gold/18 rounded-full px-2.5 py-1.5 glow-gold-sm">
                <span className="text-[13px]">🔥</span>
                <span className="text-brand-gold font-black text-sm tabular-nums">{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. TODAY'S WORKOUT — the main reason they opened the app ── */}
        {plan && todayDay && !todayDay.is_rest && (
          <TodayCard
            day={todayDay as Parameters<typeof TodayCard>[0]["day"]}
            clientId={user!.id}
            isCompleted={todayCompleted}
            completedCount={completedDays}
            totalCount={trainDays.length}
          />
        )}
        {plan && todayDay?.is_rest && (
          <RestDayCard label={todayDay.label} nextTrainingDay={nextTrainingDay} />
        )}
        {!plan && (
          <div className="rounded-2xl p-5 flex items-center gap-4 border border-zinc-800/40" style={{ background: "rgba(18,18,20,0.85)" }}>
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl shrink-0">🏋</div>
            <div>
              <p className="text-white font-bold text-sm">{t("no_plan_title", lang)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{t("no_plan_coach_note", lang)}</p>
            </div>
          </div>
        )}

        {/* ── 3. COACH MESSAGE — personal touch, right after the workout ── */}
        {feedback?.message && (
          <CoachFeedbackBanner message={feedback.message} weekStart={weekStart} />
        )}

        {/* ── 4. WEEKLY WORKOUT VIEW — collapsible ── */}
        {plan && (
          <>
            {!isCurrentWeek && (
              <div className="text-xs text-zinc-600 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5">
                {t("showing_recent", lang)}
              </div>
            )}
            <WorkoutWeek plan={plan as unknown as WorkoutPlan} clientId={user!.id} coachId={coachId ?? undefined} />
          </>
        )}

        {/* ── 5. TRAINING CALENDAR ── */}
        <MonthCalendar
          year={today.getUTCFullYear()}
          month={today.getUTCMonth()}
          dayStatuses={dayStatuses}
          todayStr={todayStr}
          lang={lang}
        />

        {/* ── 6. GOALS + CHALLENGES ── */}
        {clientGoals && clientGoals.length > 0 && (
          <ClientGoals goals={clientGoals as Parameters<typeof ClientGoals>[0]["goals"]} />
        )}
        {weekChallenges && weekChallenges.length > 0 && (
          <ChallengeCards
            challenges={weekChallenges}
            progress={challengeProgress ?? []}
            clientId={user!.id}
          />
        )}

        {/* ── 7. WEEKLY SUMMARY (Sundays) ── */}
        <WeeklySummary
          plan={plan as unknown as WorkoutPlan ?? null}
          checkin={currentCheckin as WeeklyCheckin ?? null}
          clientId={user!.id}
          weekStart={weekStart}
        />

        {/* ── 8. MUSCLE MAP — collapsible, for curious athletes ── */}
        <CollapsibleMuscleMap exerciseNames={weekExerciseNames} loggedNames={weekLoggedNames} />

        {/* ── 9. INSIGHT CARDS — contextual, non-intrusive ── */}
        {latestWeeklyReport && (
          <Link href="/client/weekly-report" className="block">
            <div className="rounded-2xl px-4 py-3.5 flex items-center gap-3 border transition-all active:scale-[0.98]" style={{ background: "rgba(18,18,20,0.85)", borderColor: "rgba(201,168,76,0.22)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))" }}>📊</div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{t("see_weekly_report", lang)}</p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">{t("report_subtitle", lang)}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          </Link>
        )}
        {monthlyData && <MonthlyReport {...monthlyData} />}

        {/* ── 10. SECONDARY / ONCE-OFF — below the fold, unobtrusive ── */}

        {/* Setup guide — visible until complete, but never above the workout */}
        <SetupChecklist
          clientId={user!.id}
          hasCompletedOnboarding={isOnboardingComplete}
          hasLoggedCheckin={!!currentCheckin}
          hasLoggedNutrition={!!anyNutritionLog}
          hasCompletedWorkout={completedDays > 0}
          hasProfilePhoto={!!clientProfile?.avatar_url}
        />

        {/* Testimonial request */}
        {pendingTestimonial && (
          <Link href="/client/testimonial" className="block active:scale-[0.98] transition-transform">
            <div
              className="flex items-center gap-3.5 px-4 py-4 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.04) 100%)",
                border: "1px solid rgba(201,168,76,0.3)",
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
                ⭐
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-snug">
                  {lang === "en" ? "Your coach wants your feedback" : "O teu coach quer o teu testemunho"}
                </p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {lang === "en" ? "Share your experience — takes 2 min" : "Partilha a tua experiência — 2 min"}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        )}

        {/* Install PWA — only if not yet installed, at the very bottom */}
        <InstallPrompt />

        {/* Payment warning — only when urgent (≤ 3 days) */}
        {daysUntilRenewal !== null && daysUntilRenewal <= 3 && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
            daysUntilRenewal <= 0 ? "border-red-500/30 bg-red-500/5" : "border-yellow-500/30 bg-yellow-500/5"
          }`}>
            <p className={`text-sm font-medium ${daysUntilRenewal <= 0 ? "text-red-400" : "text-yellow-400"}`}>
              {daysUntilRenewal <= 0
                ? t("renewal_overdue", lang)
                : daysUntilRenewal === 1
                ? t("renewal_tomorrow", lang)
                : `${t("renewal_in_days", lang)} ${daysUntilRenewal} ${t("days", lang)}`}
            </p>
            <span className={`text-xl font-black tabular-nums ${daysUntilRenewal <= 0 ? "text-red-400" : "text-yellow-400"}`}>
              {daysUntilRenewal <= 0 ? "!" : `D-${daysUntilRenewal}`}
            </span>
          </div>
        )}

      </div>
    </>
  );
}
