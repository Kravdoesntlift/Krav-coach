import type { WorkoutPlan, WeeklyCheckin } from "@/lib/supabase/types";

const ENERGY_LABELS: Record<number, string> = {
  1: "Muito baixa", 2: "Baixa", 3: "Normal", 4: "Alta", 5: "Muito alta",
};

interface Props {
  plan: WorkoutPlan | null;
  checkin: WeeklyCheckin | null;
  clientId: string;
  weekStart: string;
}

export default function WeeklySummary({ plan, checkin, clientId, weekStart }: Props) {
  const today = new Date().getDay(); // 0=Sun
  if (today !== 0) return null; // só ao domingo

  const days = plan?.workout_days ?? [];
  const trainDays = days.filter((d) => !d.is_rest);
  const completed = trainDays.filter((d) =>
    d.workout_completions?.some((c) => c.client_id === clientId)
  ).length;
  const pct = trainDays.length > 0 ? Math.round((completed / trainDays.length) * 100) : 0;

  const weekLabel = new Date(weekStart + "T00:00:00").toLocaleDateString("pt-PT", {
    day: "numeric", month: "long",
  });

  return (
    <div className="border border-brand-gold/40 bg-brand-gold/5 rounded-2xl p-4 md:p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-brand-gold text-lg">📊</span>
        <h2 className="text-white font-bold">Resumo da semana</h2>
        <span className="text-gray-500 text-xs">· {weekLabel}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className={`text-xl font-black ${pct === 100 ? "text-green-400" : "text-brand-gold"}`}>{pct}%</p>
          <p className="text-gray-500 text-[10px] mt-0.5">treinos</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-white">{checkin?.energy_level ?? "—"}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">energia</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-white">{checkin?.weight_kg ?? "—"}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">kg</p>
        </div>
      </div>

      {pct === 100 ? (
        <p className="text-green-400 text-sm font-semibold text-center">
          Semana perfeita! Continua assim na próxima semana 💪
        </p>
      ) : pct >= 50 ? (
        <p className="text-gray-300 text-sm text-center">
          Boa semana! {completed}/{trainDays.length} treinos completos.
        </p>
      ) : (
        <p className="text-gray-400 text-sm text-center">
          Semana difícil. A próxima é uma nova oportunidade 🔄
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
