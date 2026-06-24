import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/getLang";
import HabitTracker from "@/components/client/HabitTracker";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HabitDefinition {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  logged_date: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getWeekDays(todayStr: string, lang: "pt" | "en") {
  const DAY_LABELS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = lang === "en" ? DAY_LABELS_EN : DAY_LABELS_PT;

  const today = new Date(todayStr + "T12:00:00Z");
  const result: { date: string; label: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = labels[d.getUTCDay()];
    result.push({ date: dateStr, label });
  }

  return result;
}

function computeStreak(habitId: string, logs: HabitLog[], today: string): number {
  // Simple streak: count consecutive days backwards from today
  const logDates = new Set(
    logs.filter((l) => l.habit_id === habitId).map((l) => l.logged_date)
  );

  let streak = 0;
  const base = new Date(today + "T12:00:00Z");

  for (let i = 0; i < 365; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (logDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function HabitsPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const weekDays = getWeekDays(today, lang);
  const sevenDaysAgo = weekDays[0].date;

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from("habit_definitions")
      .select("id, name, emoji, created_at")
      .eq("client_id", user!.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("id, habit_id, logged_date")
      .eq("client_id", user!.id)
      .gte("logged_date", sevenDaysAgo)
      .lte("logged_date", today),
  ]);

  const safeHabits: HabitDefinition[] = habits ?? [];
  const safeLogs: HabitLog[] = logs ?? [];

  const todayLogs = safeLogs.filter((l) => l.logged_date === today);

  // Compute streaks for the stats section
  const streaks = safeHabits.map((h) => ({
    ...h,
    streak: computeStreak(h.id, safeLogs, today),
  }));

  const pageTitle = lang === "en" ? "Habits" : "Hábitos";

  return (
    <div className="page-enter min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link
          href="/client/dashboard"
          className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          🎯 {pageTitle}
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Stats row — streaks overview */}
        {streaks.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {streaks.slice(0, 3).map((h) => (
              <div
                key={h.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center space-y-1"
              >
                <div className="text-2xl">{h.emoji}</div>
                <div className="text-brand-gold font-bold text-lg leading-none">
                  {h.streak}
                </div>
                <div className="text-zinc-500 text-[10px] uppercase tracking-wide">
                  {lang === "en" ? "day streak" : "dias seguidos"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today section label */}
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
          {lang === "en" ? "Today" : "Hoje"} — {today}
        </p>

        {/* Main tracker */}
        <HabitTracker
          clientId={user!.id}
          initialHabits={safeHabits}
          initialLogs={todayLogs}
          allWeekLogs={safeLogs}
          today={today}
          weekDays={weekDays}
        />

        {/* 7-day legend (shown when there are habits) */}
        {safeHabits.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-zinc-600">
              {lang === "en"
                ? "Dots show the last 7 days for each habit"
                : "Os pontos mostram os últimos 7 dias de cada hábito"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
