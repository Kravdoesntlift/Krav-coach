import type { WeeklyCheckin } from "@/lib/supabase/types";

const ENERGY_LABELS: Record<number, string> = {
  1: "Muito baixa",
  2: "Baixa",
  3: "Normal",
  4: "Alta",
  5: "Muito alta",
};

const ENERGY_COLOR: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-lime-400",
  5: "text-green-400",
};

interface Props {
  checkins: WeeklyCheckin[];
}

export default function CheckinHistory({ checkins }: Props) {
  return (
    <div>
      <h2 className="text-white font-semibold mb-4">Histórico de Check-ins</h2>
      <div className="space-y-3">
        {checkins.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm font-medium">
                Semana de{" "}
                {new Date(c.week_start + "T00:00:00").toLocaleDateString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {c.weight_kg && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Peso</p>
                  <p className="text-white font-semibold">{c.weight_kg} <span className="text-gray-500 text-xs font-normal">kg</span></p>
                </div>
              )}
              {c.energy_level && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Energia</p>
                  <p className={`font-semibold ${ENERGY_COLOR[c.energy_level]}`}>
                    {c.energy_level}/5{" "}
                    <span className="text-gray-400 text-xs font-normal">{ENERGY_LABELS[c.energy_level]}</span>
                  </p>
                </div>
              )}
            </div>

            {c.notes && (
              <p className="text-gray-400 text-sm mt-3 pt-3 border-t border-zinc-800">
                {c.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
