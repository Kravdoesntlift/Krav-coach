import { createClient } from "@/lib/supabase/server";
import { DAY_NAMES_FULL, byWeekOrder } from "@/lib/supabase/types";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

const extra = {
  history_title:    { pt: "Histórico de Treinos", en: "Workout History" },
  prev_weeks:       { pt: "Semanas anteriores",   en: "Previous weeks" },
  week_of:          { pt: "Semana de",            en: "Week of" },
  workouts_unit:    { pt: "treinos",              en: "workouts" },
  no_history_link:  { pt: "Ver treino desta semana", en: "View this week's workout" },
} as const;

export default async function HistoryPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  // All past plans (excludes current week)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const currentWeekStart = monday.toISOString().split("T")[0];

  const { data: plans } = await supabase
    .from("workout_plans")
    .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
    .eq("client_id", user!.id)
    .lt("week_start", currentWeekStart)
    .order("week_start", { ascending: false })
    .limit(12);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{extra.history_title[lang]}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.prev_weeks[lang]}</p>
      </div>

      {!plans?.length ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">{t("no_history", lang)}</p>
          <Link href="/client/dashboard" className="text-brand-gold text-sm mt-3 inline-block hover:underline">
            {extra.no_history_link[lang]}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const days = plan.workout_days ?? [];
            const totalDays = days.length;
            const completedDays = days.filter((d: { workout_completions?: { client_id: string }[] }) =>
              d.workout_completions?.some((c) => c.client_id === user!.id)
            ).length;
            const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            return (
              <div key={plan.id} className="card p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{plan.name}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {extra.week_of[lang]}{" "}
                      {new Date(plan.week_start + "T00:00:00").toLocaleDateString(
                        lang === "en" ? "en-GB" : "pt-PT",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-xl leading-none ${pct === 100 ? "text-green-400" : "text-brand-gold"}`}>
                      {pct}%
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {completedDays}/{totalDays} {extra.workouts_unit[lang]}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-zinc-800 rounded-full mb-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-400" : "bg-brand-gold"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Days */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[...days]
                    .sort(byWeekOrder)
                    .map((day: { id: string; day_of_week: number; label: string | null; exercises?: { id: string }[]; workout_completions?: { client_id: string }[] }) => {
                      const done = day.workout_completions?.some((c) => c.client_id === user!.id);
                      return (
                        <div key={day.id} className="flex items-center gap-2 py-1">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? "bg-green-400" : "bg-zinc-700"}`} />
                          <span className={`text-xs ${done ? "text-gray-300" : "text-gray-600"}`}>
                            {DAY_NAMES_FULL[day.day_of_week]}
                            {day.label && <span className="text-gray-600 ml-1">· {day.label}</span>}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
