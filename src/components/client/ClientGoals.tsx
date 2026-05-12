"use client";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  deadline: string | null;
  completed: boolean;
}

export default function ClientGoals({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🎯</span>
        <h3 className="text-white font-bold">As tuas metas</h3>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => {
          const pct = goal.target_value && goal.current_value != null
            ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
            : goal.completed ? 100 : 0;

          const daysLeft = goal.deadline
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
            : null;

          return (
            <div
              key={goal.id}
              className={`rounded-xl p-4 border ${goal.completed ? "bg-green-500/10 border-green-500/20" : "bg-zinc-800 border-zinc-700/50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{goal.title}</span>
                    {goal.completed && (
                      <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        ✓ Concluída
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-gray-500 text-xs mt-0.5">{goal.description}</p>
                  )}
                </div>
                {daysLeft != null && !goal.completed && (
                  <span className={`text-xs shrink-0 ${daysLeft < 7 ? "text-red-400" : daysLeft < 30 ? "text-yellow-400" : "text-gray-500"}`}>
                    {daysLeft > 0 ? `${daysLeft}d` : "Prazo passado"}
                  </span>
                )}
              </div>

              {goal.target_value != null && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {goal.current_value ?? 0} / {goal.target_value} {goal.unit}
                    </span>
                    <span className={`font-bold ${goal.completed ? "text-green-400" : "text-brand-gold"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${goal.completed ? "bg-green-500" : "bg-brand-gold"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
