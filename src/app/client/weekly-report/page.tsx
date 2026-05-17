import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface WeeklyReport {
  id: string;
  week_start: string;
  workouts_completed: number;
  workouts_total: number;
  weight_kg: number | null;
  weight_change: number | null;
  waist_cm: number | null;
  waist_change: number | null;
  energy_avg: number | null;
  ai_message: string | null;
  photo_before_url: string | null;
  photo_latest_url: string | null;
  coach_id: string;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  const MONTHS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = MONTHS[start.getUTCMonth()];
  const endMonth = MONTHS[end.getUTCMonth()];
  const year = end.getUTCFullYear();

  if (start.getUTCMonth() === end.getUTCMonth()) {
    return `${startDay} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

function ChangeTag({ value, unit }: { value: number; unit: string }) {
  // Negative = good for body measurements (weight loss, waist reduction)
  const isGood = value < 0;
  const isNeutral = value === 0;
  const color = isNeutral
    ? "text-zinc-400 bg-zinc-800"
    : isGood
    ? "text-emerald-400 bg-emerald-500/10"
    : "text-red-400 bg-red-500/10";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {sign}{value}{unit}
    </span>
  );
}

function EnergyBar({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all ${
            i <= filled ? "bg-brand-gold" : "bg-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

export default async function WeeklyReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: report } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("client_id", user.id)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedReport = report as WeeklyReport | null;

  const { data: coachProfile } = typedReport?.coach_id
    ? await supabase.from("profiles").select("full_name").eq("id", typedReport.coach_id).single()
    : { data: null };

  const workoutPct =
    typedReport && typedReport.workouts_total > 0
      ? Math.round((typedReport.workouts_completed / typedReport.workouts_total) * 100)
      : 0;

  return (
    <div className="space-y-5 page-enter pb-28">
      {/* Header */}
      <div className="space-y-1 pt-1">
        <p className="text-zinc-600 text-xs font-semibold tracking-[0.15em] uppercase">
          {typedReport ? formatWeekRange(typedReport.week_start) : "—"}
        </p>
        <h1 className="text-[1.75rem] font-black tracking-tight leading-[1.1]">
          Relatório{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #E8C96B, #C9A84C)" }}
          >
            Semanal
          </span>
        </h1>
      </div>

      {/* Empty state */}
      {!typedReport && (
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-3 border border-zinc-800 text-center"
          style={{ background: "rgba(18,18,20,0.85)" }}
        >
          <span className="text-4xl">📊</span>
          <p className="text-white font-semibold">Ainda sem relatório</p>
          <p className="text-zinc-500 text-sm">
            O teu relatório de domingo ainda não foi gerado. Volta mais tarde.
          </p>
        </div>
      )}

      {typedReport && (
        <>
          {/* Workouts card */}
          <div
            className="rounded-2xl p-5 border border-zinc-800 space-y-4"
            style={{ background: "rgba(18,18,20,0.85)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💪</span>
                <span className="text-white font-bold text-sm">Treinos</span>
              </div>
              <span className="text-zinc-400 text-sm font-medium">
                {typedReport.workouts_completed} de {typedReport.workouts_total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${workoutPct}%`,
                    background: "linear-gradient(90deg, #A8893A, #C9A84C, #E8C96B)",
                  }}
                />
              </div>
              <p className="text-right text-xs text-zinc-500 font-medium">{workoutPct}%</p>
            </div>
          </div>

          {/* Metrics card */}
          {(typedReport.weight_kg != null ||
            typedReport.waist_cm != null ||
            typedReport.energy_avg != null) && (
            <div
              className="rounded-2xl p-5 border border-zinc-800 space-y-4"
              style={{ background: "rgba(18,18,20,0.85)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <span className="text-white font-bold text-sm">Métricas</span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {typedReport.weight_kg != null && (
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">Peso</p>
                      <p className="text-white font-bold text-lg mt-0.5">{typedReport.weight_kg} kg</p>
                    </div>
                    {typedReport.weight_change != null && (
                      <ChangeTag value={typedReport.weight_change} unit="kg" />
                    )}
                  </div>
                )}

                {typedReport.waist_cm != null && (
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">Cintura</p>
                      <p className="text-white font-bold text-lg mt-0.5">{typedReport.waist_cm} cm</p>
                    </div>
                    {typedReport.waist_change != null && (
                      <ChangeTag value={typedReport.waist_change} unit="cm" />
                    )}
                  </div>
                )}

                {typedReport.energy_avg != null && (
                  <div className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider font-medium">
                        Energia média
                      </p>
                      <p className="text-white font-bold">{typedReport.energy_avg}/5</p>
                    </div>
                    <EnergyBar value={typedReport.energy_avg} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Coach message card */}
          {typedReport.ai_message && (
            <div
              className="rounded-2xl p-5 border space-y-4"
              style={{
                background: "rgba(18,18,20,0.85)",
                borderColor: "rgba(201,168,76,0.18)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Coach avatar placeholder */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg, #E8C96B, #C9A84C)" }}
                >
                  {(coachProfile?.full_name ?? "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {coachProfile?.full_name ?? "O teu Coach"}
                  </p>
                  <p className="text-zinc-500 text-xs">Mensagem da semana</p>
                </div>
              </div>

              <div
                className="h-px"
                style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)" }}
              />

              <p className="text-zinc-200 text-sm leading-relaxed italic">
                &ldquo;{typedReport.ai_message}&rdquo;
              </p>
            </div>
          )}

          {/* Photo comparison */}
          {typedReport.photo_before_url && typedReport.photo_latest_url && (
            <div
              className="rounded-2xl p-5 border border-zinc-800 space-y-4"
              style={{ background: "rgba(18,18,20,0.85)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <span className="text-white font-bold text-sm">A tua evolução</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-zinc-500 text-xs font-medium text-center uppercase tracking-wider">
                    Antes
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={typedReport.photo_before_url}
                    alt="Foto anterior"
                    className="w-full aspect-[3/4] object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-zinc-500 text-xs font-medium text-center uppercase tracking-wider">
                    Agora
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={typedReport.photo_latest_url}
                    alt="Foto recente"
                    className="w-full aspect-[3/4] object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
