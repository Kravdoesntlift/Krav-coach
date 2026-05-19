import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/report/pdf?month=YYYY-MM
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  const [year, mon] = (month ?? "").split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    return NextResponse.json({ error: "Parâmetro month inválido (YYYY-MM)" }, { status: 400 });
  }

  const startDate = `${year}-${String(mon).padStart(2, "0")}-01`;
  const endDate   = `${year}-${String(mon).padStart(2, "0")}-31`;

  const admin = createAdminClient();

  const [
    { data: profile },
    { data: checkins },
    { data: completions },
    { data: prs },
  ] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    admin.from("weekly_checkins")
      .select("weight_kg, energy_level, notes, week_start")
      .eq("client_id", user.id)
      .gte("week_start", startDate)
      .lte("week_start", endDate)
      .order("week_start", { ascending: true }),
    admin.from("workout_completions")
      .select("completed_at")
      .eq("client_id", user.id)
      .gte("completed_at", startDate + "T00:00:00Z")
      .lte("completed_at", endDate + "T23:59:59Z"),
    admin.from("personal_records")
      .select("exercise_name, weight_kg, reps, recorded_at")
      .eq("client_id", user.id)
      .gte("recorded_at", startDate)
      .lte("recorded_at", endDate)
      .order("recorded_at", { ascending: false }),
  ]);

  const clientName  = profile?.full_name ?? "Cliente";
  const monthLabel  = new Date(startDate + "T12:00:00").toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const weights     = (checkins ?? []).filter((c) => c.weight_kg).map((c) => c.weight_kg as number);
  const firstWeight = weights[0] ?? null;
  const lastWeight  = weights[weights.length - 1] ?? null;
  const weightDelta = firstWeight && lastWeight ? lastWeight - firstWeight : null;
  const avgEnergy   = (checkins ?? []).filter((c) => c.energy_level).length
    ? (checkins ?? []).reduce((s, c) => s + (c.energy_level ?? 0), 0) / (checkins ?? []).filter((c) => c.energy_level).length
    : null;

  const data = {
    clientName,
    monthLabel,
    month,
    trainings:   (completions ?? []).length,
    checkins:    (checkins ?? []).length,
    firstWeight,
    lastWeight,
    weightDelta: weightDelta !== null ? Math.round(weightDelta * 10) / 10 : null,
    avgEnergy:   avgEnergy !== null ? Math.round(avgEnergy * 10) / 10 : null,
    prs:         (prs ?? []).slice(0, 5).map((p) => ({ ...p, achieved_at: (p as Record<string, unknown>).recorded_at as string })),
    notes:       (checkins ?? []).filter((c) => c.notes).map((c) => ({ week: c.week_start, note: c.notes as string })).slice(0, 4),
  };

  return NextResponse.json(data);
}
