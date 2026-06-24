"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/useLang";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_count: number;
}

interface Progress {
  challenge_id: string;
  current_count: number;
  completed: boolean;
}

interface Props {
  challenges: Challenge[];
  progress: Progress[];
  clientId: string;
}

export default function ChallengeCards({ challenges, progress: initialProgress, clientId }: Props) {
  const [progress, setProgress] = useState<Progress[]>(initialProgress);
  const [loading, setLoading] = useState<string | null>(null);
  const { lang } = useLang();
  const isEN = lang === "en";

  const TYPE_LABELS: Record<string, string> = isEN
    ? { workouts: "workouts", checkins: "check-ins", weight_logs: "weight logs", custom: "tasks" }
    : { workouts: "treinos",  checkins: "check-ins", weight_logs: "registos de peso", custom: "tarefas" };

  if (!challenges.length) return null;

  function getProgress(challengeId: string) {
    return progress.find((p) => p.challenge_id === challengeId);
  }

  async function increment(challenge: Challenge) {
    const current = getProgress(challenge.id);
    const currentCount = current?.current_count ?? 0;
    const newCount = Math.min(currentCount + 1, challenge.target_count);
    const completed = newCount >= challenge.target_count;

    setLoading(challenge.id);
    const supabase = createClient();
    await supabase.from("challenge_progress").upsert({
      challenge_id: challenge.id,
      client_id: clientId,
      current_count: newCount,
      completed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "challenge_id,client_id" });

    setProgress((prev) => {
      const existing = prev.find((p) => p.challenge_id === challenge.id);
      if (existing) {
        return prev.map((p) =>
          p.challenge_id === challenge.id ? { ...p, current_count: newCount, completed } : p
        );
      }
      return [...prev, { challenge_id: challenge.id, current_count: newCount, completed }];
    });
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold text-sm">
        {isEN ? "Weekly challenges" : "Desafios da semana"}
      </h3>
      {challenges.map((c) => {
        const prog = getProgress(c.id);
        const current = prog?.current_count ?? 0;
        const pct = Math.min(100, Math.round((current / c.target_count) * 100));
        const done = prog?.completed ?? false;

        return (
          <div key={c.id} className={`card p-4 transition-colors ${done ? "border-green-500/30" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{c.title}</p>
                {c.description && (
                  <p className="text-gray-500 text-xs mt-0.5">{c.description}</p>
                )}
                <p className="text-gray-600 text-xs mt-0.5">
                  {isEN ? "Goal" : "Meta"}: {c.target_count} {TYPE_LABELS[c.target_type] ?? (isEN ? "tasks" : "tarefas")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`text-lg font-black tabular-nums ${done ? "text-green-400" : "text-brand-gold"}`}>
                  {current}/{c.target_count}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${done ? "bg-green-500" : "bg-brand-gold"}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {done ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                <span>{isEN ? "Challenge complete!" : "Desafio concluído!"}</span>
                <span>🏆</span>
              </div>
            ) : (
              <button
                onClick={() => increment(c)}
                disabled={loading === c.id}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                {loading === c.id ? "..." : (isEN ? "+ Log progress" : "+ Registar progresso")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
