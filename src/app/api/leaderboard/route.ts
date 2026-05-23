import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/leaderboard?month=2026-05-01
// Returns ranked clients with scores for the given month.
// Clients see anonymised names; coaches see real names.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

  const isCoach = profile.role === "coach";

  // Determine month (default = current month)
  const monthParam = req.nextUrl.searchParams.get("month");
  const now = new Date();
  const monthStart = monthParam
    ? monthParam // e.g. "2026-05-01"
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const monthDate = new Date(monthStart + "T00:00:00Z");
  const nextMonth = new Date(monthDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10); // exclusive upper bound

  const admin = createAdminClient();

  // Find the challenge for this coach/month
  let coachId: string;
  let challenge: {
    id: string;
    reward_title: string;
    reward_description: string | null;
    reward_image_url: string | null;
    points_per_workout: number;
    points_per_checkin: number;
    points_per_nutrition: number;
    points_per_1000_steps: number;
    winner_client_id: string | null;
    winner_announced: boolean;
  } | null = null;

  if (isCoach) {
    coachId = user.id;
  } else {
    // Find this client's coach
    const { data: rel } = await admin
      .from("coach_clients")
      .select("coach_id")
      .eq("client_id", user.id)
      .maybeSingle();
    if (!rel) return NextResponse.json({ error: "Sem coach associado." }, { status: 404 });
    coachId = rel.coach_id;
  }

  const { data: ch } = await admin
    .from("monthly_challenges")
    .select("*")
    .eq("coach_id", coachId)
    .eq("month", monthStart)
    .maybeSingle();

  // Use challenge weights or sensible defaults
  const weights = {
    workout: ch?.points_per_workout ?? 10,
    checkin: ch?.points_per_checkin ?? 15,
    nutrition: ch?.points_per_nutrition ?? 5,
    steps1k: ch?.points_per_1000_steps ?? 2,
  };

  if (ch) {
    challenge = ch as typeof challenge;
  }

  // Get all clients of this coach
  const { data: relations } = await admin
    .from("coach_clients")
    .select("client_id")
    .eq("coach_id", coachId);

  if (!relations || relations.length === 0) {
    return NextResponse.json({ challenge, scores: [], monthStart });
  }

  const clientIds = relations.map((r) => r.client_id);

  // Fetch all data in parallel for the month
  const [
    { data: profiles },
    { data: workouts },
    { data: checkins },
    { data: nutritionLogs },
    { data: healthLogs },
  ] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", clientIds),
    // workout completions — join to get week_start for filtering
    admin
      .from("workout_completions")
      .select("client_id, completed_at")
      .in("client_id", clientIds)
      .gte("completed_at", monthStart)
      .lt("completed_at", monthEnd),
    admin
      .from("weekly_checkins")
      .select("client_id, week_start")
      .in("client_id", clientIds)
      .gte("week_start", monthStart)
      .lt("week_start", monthEnd),
    admin
      .from("nutrition_logs")
      .select("client_id, logged_at")
      .in("client_id", clientIds)
      .gte("logged_at", monthStart)
      .lt("logged_at", monthEnd),
    admin
      .from("daily_health_logs")
      .select("client_id, log_date, steps")
      .in("client_id", clientIds)
      .gte("log_date", monthStart)
      .lt("log_date", monthEnd),
  ]);

  // Build score per client
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name as string]));

  const scores = clientIds.map((cid) => {
    const workoutCount = (workouts ?? []).filter((w) => w.client_id === cid).length;
    const checkinCount = (checkins ?? []).filter((c) => c.client_id === cid).length;

    // Unique days with nutrition logs
    const nutritionDays = new Set(
      (nutritionLogs ?? []).filter((n) => n.client_id === cid).map((n) => n.logged_at)
    ).size;

    // Total steps for the month (sum)
    const totalSteps = (healthLogs ?? [])
      .filter((h) => h.client_id === cid)
      .reduce((sum, h) => sum + (h.steps ?? 0), 0);

    const score =
      workoutCount * weights.workout +
      checkinCount * weights.checkin +
      nutritionDays * weights.nutrition +
      Math.floor(totalSteps / 1000) * weights.steps1k;

    const fullName = profileMap.get(cid) ?? "Cliente";

    return {
      clientId: cid,
      fullName,
      score,
      breakdown: { workoutCount, checkinCount, nutritionDays, totalSteps },
    };
  });

  scores.sort((a, b) => b.score - a.score);

  // Anonymise for clients: show first name + last initial of others
  const currentClientId = isCoach ? null : user.id;
  const anonymised = scores.map((s, i) => {
    const isMe = s.clientId === currentClientId;
    let displayName: string;
    if (isCoach || isMe) {
      displayName = s.fullName;
    } else {
      const parts = s.fullName.split(" ");
      displayName = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : "");
    }
    return {
      rank: i + 1,
      clientId: isCoach ? s.clientId : undefined,
      displayName,
      isMe,
      score: s.score,
      breakdown: s.breakdown,
    };
  });

  return NextResponse.json({ challenge, scores: anonymised, monthStart, weights });
}
