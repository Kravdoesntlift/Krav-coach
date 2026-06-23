"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/useLang";

const extra = {
  leaderboard_title: { pt: "Leaderboard", en: "Leaderboard" },
  days_left:         { pt: (n: number) => `${n} dias restantes`, en: (n: number) => `${n} days left` },
  month_ended:       { pt: "Mês terminado", en: "Month ended" },
  reward_month:      { pt: "Recompensa do mês", en: "Monthly reward" },
  winner_announced:  { pt: "🎉 Vencedor anunciado!", en: "🎉 Winner announced!" },
  congrats_you:      { pt: "Parabéns, FOSTE TU! 🥇", en: "Congratulations, it was YOU! 🥇" },
  won_month:         { pt: (name: string) => `${name} ganhou este mês!`, en: (name: string) => `${name} won this month!` },
  no_reward:         { pt: "Nenhuma recompensa definida ainda para este mês.", en: "No reward defined yet for this month." },
  coach_announce:    { pt: "O teu coach vai anunciar em breve!", en: "Your coach will announce soon!" },
  my_position:       { pt: "A tua posição", en: "Your position" },
  breakdown:         { pt: (b: { workoutCount: number; checkinCount: number; nutritionDays: number; totalSteps: number }) =>
    `${b.workoutCount} treinos · ${b.checkinCount} check-ins · ${b.nutritionDays} dias nutrição · ${(b.totalSteps / 1000).toFixed(1)}k passos`,
                       en: (b: { workoutCount: number; checkinCount: number; nutritionDays: number; totalSteps: number }) =>
    `${b.workoutCount} workouts · ${b.checkinCount} check-ins · ${b.nutritionDays} nutrition days · ${(b.totalSteps / 1000).toFixed(1)}k steps` },
  ranking:           { pt: "Classificação", en: "Rankings" },
  no_scores:         { pt: "Ainda não há pontuações este mês.", en: "No scores yet this month." },
  you:               { pt: "(tu)", en: "(you)" },
  pts:               { pt: "pts", en: "pts" },
  workouts:          { pt: "Treinos", en: "Workouts" },
  checkins:          { pt: "Check-ins", en: "Check-ins" },
  nutrition:         { pt: "Nutrição", en: "Nutrition" },
  steps:             { pt: "Passos", en: "Steps" },
  how_points:        { pt: "Como são calculados os pontos", en: "How points are calculated" },
  workout_pts:       { pt: "🏋️ Treino completado", en: "🏋️ Workout completed" },
  checkin_pts:       { pt: "📋 Check-in semanal", en: "📋 Weekly check-in" },
  nutrition_pts:     { pt: "🥗 Dia com registo nutricional", en: "🥗 Day with nutrition log" },
  steps_pts:         { pt: "👟 Cada 1000 passos", en: "👟 Every 1000 steps" },
  failed_load:       { pt: "Não foi possível carregar o leaderboard.", en: "Could not load the leaderboard." },
  locale:            { pt: "pt-PT", en: "en-US" },
} as const;

interface Breakdown {
  workoutCount: number;
  checkinCount: number;
  nutritionDays: number;
  totalSteps: number;
}

interface ScoreEntry {
  rank: number;
  displayName: string;
  isMe: boolean;
  score: number;
  breakdown: Breakdown;
}

interface Challenge {
  id: string;
  reward_title: string;
  reward_description: string | null;
  reward_image_url: string | null;
  winner_client_id: string | null;
  winner_announced: boolean;
}

interface LeaderboardData {
  challenge: Challenge | null;
  scores: ScoreEntry[];
  monthStart: string;
  weights: { workout: number; checkin: number; nutrition: number; steps1k: number };
}

function getMonthLabel(monthStart: string, locale: string) {
  const d = new Date(monthStart + "T00:00:00");
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function daysLeftInMonth() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { t, lang } = useLang();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-20">
        <p>{extra.failed_load[lang]}</p>
      </div>
    );
  }

  const { challenge, scores, monthStart, weights } = data;
  const daysLeft = daysLeftInMonth();
  const myEntry = scores.find((s) => s.isMe);
  const locale = extra.locale[lang];

  return (
    <div className="space-y-6 page-enter pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white capitalize">
          {extra.leaderboard_title[lang]} · {getMonthLabel(monthStart, locale)}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {daysLeft > 0 ? extra.days_left[lang](daysLeft) : extra.month_ended[lang]}
        </p>
      </div>

      {/* Reward card */}
      {challenge ? (
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <p className="text-brand-gold font-bold text-sm uppercase tracking-wide">{extra.reward_month[lang]}</p>
          </div>
          {challenge.reward_image_url && (
            <img
              src={challenge.reward_image_url}
              alt={challenge.reward_title}
              className="w-full h-32 object-cover rounded-xl"
            />
          )}
          <p className="text-white font-bold text-lg leading-tight">{challenge.reward_title}</p>
          {challenge.reward_description && (
            <p className="text-gray-400 text-sm leading-relaxed">{challenge.reward_description}</p>
          )}
          {challenge.winner_announced && challenge.winner_client_id && (
            <div className="mt-2 px-4 py-3 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-center">
              <p className="text-brand-gold font-bold">{extra.winner_announced[lang]}</p>
              <p className="text-gray-300 text-sm mt-1">
                {scores.find((s) => s.isMe && s.rank === 1)
                  ? extra.congrats_you[lang]
                  : extra.won_month[lang](scores[0]?.displayName ?? "")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5 text-center space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-gray-400 text-sm">{extra.no_reward[lang]}</p>
          <p className="text-gray-600 text-xs">{extra.coach_announce[lang]}</p>
        </div>
      )}

      {/* My position highlight */}
      {myEntry && (
        <div className={`rounded-2xl p-4 border ${
          myEntry.rank === 1
            ? "border-brand-gold/40 bg-brand-gold/10"
            : "border-zinc-700 bg-zinc-900"
        }`}>
          <p className="text-gray-400 text-xs mb-1">{extra.my_position[lang]}</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-white">#{myEntry.rank}</span>
            <div className="flex-1">
              <p className="text-white font-bold">{myEntry.score} {extra.pts[lang]}</p>
              <p className="text-gray-500 text-xs">
                {extra.breakdown[lang](myEntry.breakdown)}
              </p>
            </div>
            {myEntry.rank <= 3 && <span className="text-3xl">{MEDAL[myEntry.rank - 1]}</span>}
          </div>
        </div>
      )}

      {/* Ranking list */}
      <div className="space-y-2">
        <p className="text-gray-400 text-sm font-semibold">{extra.ranking[lang]}</p>
        {scores.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">{extra.no_scores[lang]}</p>
        )}
        {scores.map((entry) => (
          <div key={entry.rank}>
            <button
              onClick={() => setExpanded(expanded === entry.rank ? null : entry.rank)}
              className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-colors text-left ${
                entry.isMe
                  ? "bg-brand-gold/8 border border-brand-gold/20"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {entry.rank <= 3
                  ? <span className="text-2xl leading-none">{MEDAL[entry.rank - 1]}</span>
                  : <span className="text-gray-500 font-bold text-sm">#{entry.rank}</span>
                }
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${entry.isMe ? "text-brand-gold" : "text-white"}`}>
                  {entry.displayName} {entry.isMe && <span className="text-xs font-normal text-gray-500">{extra.you[lang]}</span>}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-white font-bold text-lg">{entry.score}</p>
                <p className="text-gray-600 text-xs">{extra.pts[lang]}</p>
              </div>

              {/* Expand chevron */}
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${expanded === entry.rank ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded breakdown */}
            {expanded === entry.rank && (
              <div className="mx-2 -mt-1 bg-zinc-900/50 border border-t-0 border-zinc-800 rounded-b-2xl px-4 py-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{extra.workouts[lang]}</span>
                    <span className="text-white font-semibold">{entry.breakdown.workoutCount} × {weights.workout}{extra.pts[lang]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{extra.checkins[lang]}</span>
                    <span className="text-white font-semibold">{entry.breakdown.checkinCount} × {weights.checkin}{extra.pts[lang]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{extra.nutrition[lang]}</span>
                    <span className="text-white font-semibold">{entry.breakdown.nutritionDays}d × {weights.nutrition}{extra.pts[lang]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{extra.steps[lang]}</span>
                    <span className="text-white font-semibold">{(entry.breakdown.totalSteps / 1000).toFixed(1)}k × {weights.steps1k}{extra.pts[lang]}/1k</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scoring legend */}
      <div className="card p-4 space-y-2">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{extra.how_points[lang]}</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex justify-between"><span>{extra.workout_pts[lang]}</span><span className="text-white font-semibold">+{weights.workout} {extra.pts[lang]}</span></div>
          <div className="flex justify-between"><span>{extra.checkin_pts[lang]}</span><span className="text-white font-semibold">+{weights.checkin} {extra.pts[lang]}</span></div>
          <div className="flex justify-between"><span>{extra.nutrition_pts[lang]}</span><span className="text-white font-semibold">+{weights.nutrition} {extra.pts[lang]}</span></div>
          <div className="flex justify-between"><span>{extra.steps_pts[lang]}</span><span className="text-white font-semibold">+{weights.steps1k} {extra.pts[lang]}</span></div>
        </div>
      </div>
    </div>
  );
}
