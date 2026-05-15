import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import PrintReport from "@/components/client/PrintReport";
import CoachMonthPicker from "@/components/coach/CoachMonthPicker";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default async function CoachClientReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { clientId } = await params;
  const { m } = await searchParams;

  // Verify coach owns this client
  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) redirect("/coach/dashboard");

  const admin = createAdminClient();

  // Parse month param or default to last month
  const now = new Date();
  let targetYear: number;
  let targetMonth: number;

  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    targetYear = y;
    targetMonth = mo - 1;
  } else {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    targetYear = lastMonth.getFullYear();
    targetMonth = lastMonth.getMonth();
  }

  const monthStart = new Date(targetYear, targetMonth, 1);
  const monthEnd = new Date(targetYear, targetMonth + 1, 0);
  const lmStart = `${monthStart.getFullYear()}-${String(monthStart.getMonth()+1).padStart(2,"0")}-01`;
  const lmEnd = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth()+1).padStart(2,"0")}-${String(monthEnd.getDate()).padStart(2,"0")}`;

  const [
    { data: profile },
    { data: prs },
    { data: checkins },
    { data: logs },
    { data: plans },
  ] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", clientId).single(),
    admin.from("personal_records").select("*").eq("client_id", clientId)
      .gte("recorded_at", lmStart).lte("recorded_at", lmEnd),
    admin.from("weekly_checkins").select("*").eq("client_id", clientId)
      .gte("week_start", lmStart).lte("week_start", lmEnd).order("week_start"),
    admin.from("workout_logs").select("exercise_name, sets, logged_at").eq("client_id", clientId)
      .gte("logged_at", lmStart).lte("logged_at", lmEnd),
    admin.from("workout_plans")
      .select("week_start, workout_days(id, is_rest, workout_completions(client_id))")
      .eq("client_id", clientId)
      .gte("week_start", lmStart).lte("week_start", lmEnd),
  ]);

  let totalWorkouts = 0;
  let totalPlannedDays = 0;
  for (const p of plans ?? []) {
    const days = p.workout_days as { is_rest: boolean; workout_completions: { client_id: string }[] }[] | null;
    for (const d of days ?? []) {
      if (d.is_rest) continue;
      totalPlannedDays++;
      if (d.workout_completions?.some((c) => c.client_id === clientId)) totalWorkouts++;
    }
  }

  const totalPRs = prs?.length ?? 0;
  const weights = (checkins ?? []).map((c) => c.weight_kg).filter(Boolean) as number[];
  const weightChange = weights.length >= 2 ? +(weights[weights.length - 1] - weights[0]).toFixed(1) : null;
  const energyCheckins = (checkins ?? []).filter((c) => c.energy_level);
  const avgEnergy = energyCheckins.length
    ? +(energyCheckins.reduce((s, c) => s + (c.energy_level ?? 0), 0) / energyCheckins.length).toFixed(1)
    : null;
  const adherence = totalPlannedDays > 0 ? Math.round((totalWorkouts / totalPlannedDays) * 100) : null;

  const exerciseMap = new Map<string, number>();
  for (const log of logs ?? []) {
    const vol = (log.sets as { done: boolean }[])?.filter((s) => s.done).length ?? 0;
    if (vol > 0) exerciseMap.set(log.exercise_name, (exerciseMap.get(log.exercise_name) ?? 0) + vol);
  }
  const topExercises = Array.from(exerciseMap.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, sets]) => ({ name, sets }));

  let totalVolumeKg = 0;
  for (const log of logs ?? []) {
    for (const s of (log.sets as { weight_kg?: number; reps?: number; done: boolean }[]) ?? []) {
      if (s.done && s.weight_kg && s.reps) totalVolumeKg += s.weight_kg * s.reps;
    }
  }

  const availableMonths: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
    availableMonths.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }

  const currentMonthParam = `${targetYear}-${String(targetMonth+1).padStart(2,"0")}`;

  return (
    <>
      <div className="no-print mb-2">
        <a href={`/coach/clients/${clientId}`} className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">
          ← Voltar ao cliente
        </a>
      </div>
      <CoachMonthPicker
        clientId={clientId}
        current={currentMonthParam}
        options={availableMonths}
        monthNames={MONTH_NAMES}
      />
      <PrintReport
        clientName={profile?.full_name ?? ""}
        month={MONTH_NAMES[targetMonth]}
        year={targetYear}
        totalWorkouts={totalWorkouts}
        totalPlannedDays={totalPlannedDays}
        totalPRs={totalPRs}
        weightChange={weightChange}
        avgEnergy={avgEnergy}
        adherence={adherence}
        checkins={checkins ?? []}
        topExercises={topExercises}
        prs={prs ?? []}
        totalVolumeKg={Math.round(totalVolumeKg)}
      />
    </>
  );
}
