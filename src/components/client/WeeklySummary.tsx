"use client";

import type { WorkoutPlan, WeeklyCheckin } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n/useLang";

interface Props {
  plan: WorkoutPlan | null;
  checkin: WeeklyCheckin | null;
  clientId: string;
  weekStart: string;
}

export default function WeeklySummary({ plan, checkin, clientId, weekStart }: Props) {
  const { t, lang } = useLang();

  const extra = {
    week_summary:    { pt: "Resumo da semana",                          en: "Week summary" },
    workouts_label:  { pt: "treinos",                                   en: "workouts" },
    energy_label:    { pt: "energia",                                   en: "energy" },
    perfect_week:    { pt: "Semana perfeita! Continua assim na próxima semana 💪", en: "Perfect week! Keep it up next week 💪" },
    good_week:       { pt: "Boa semana!",                               en: "Great week!" },
    workouts_done:   { pt: "treinos completos.",                        en: "workouts completed." },
    tough_week:      { pt: "Semana difícil. A próxima é uma nova oportunidade 🔄", en: "Tough week. Next one is a fresh start 🔄" },
  } as const;

  const today = new Date().getDay(); // 0=Sun
  if (today !== 0) return null; // só ao domingo

  const days = plan?.workout_days ?? [];
  const trainDays = days.filter((d) => !d.is_rest);
  const completed = trainDays.filter((d) =>
    d.workout_completions?.some((c) => c.client_id === clientId)
  ).length;
  const pct = trainDays.length > 0 ? Math.round((completed / trainDays.length) * 100) : 0;

  const locale = lang === "pt" ? "pt-PT" : "en-GB";
  const weekLabel = new Date(weekStart + "T00:00:00").toLocaleDateString(locale, {
    day: "numeric", month: "long",
  });

  return (
    <div className="border border-brand-gold/40 bg-brand-gold/5 rounded-2xl p-4 md:p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-gold text-lg">📊</span>
        <h2 className="text-white font-bold">{extra.week_summary[lang]}</h2>
        <span className="text-gray-500 text-xs">· {weekLabel}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className={`text-xl font-black ${pct === 100 ? "text-green-400" : "text-brand-gold"}`}>{pct}%</p>
          <p className="text-gray-500 text-[10px] mt-0.5">{extra.workouts_label[lang]}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-white">{checkin?.energy_level ?? "—"}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">{extra.energy_label[lang]}</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-white">{checkin?.weight_kg ?? "—"}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">{t("kg")}</p>
        </div>
      </div>

      {pct === 100 ? (
        <p className="text-green-400 text-sm font-semibold text-center">
          {extra.perfect_week[lang]}
        </p>
      ) : pct >= 50 ? (
        <p className="text-gray-300 text-sm text-center">
          {extra.good_week[lang]} {completed}/{trainDays.length} {extra.workouts_done[lang]}
        </p>
      ) : (
        <p className="text-gray-400 text-sm text-center">
          {extra.tough_week[lang]}
        </p>
      )}

      {checkin?.notes && (
        <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-zinc-800 italic">
          "{checkin.notes}"
        </p>
      )}
    </div>
  );
}
