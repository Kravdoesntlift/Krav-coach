import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * GET /api/cron/workout-reminder
 *
 * Called automatically by Vercel Cron (vercel.json) every weekday at 08:00 UTC.
 * Sends a push notification to clients who have a training session scheduled for
 * today but haven't completed it yet.
 *
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Date logic ────────────────────────────────────────────────────────────
  const today      = new Date();
  const dayOfWeek  = today.getUTCDay(); // 0=Sun … 6=Sat
  const mondayUTC  = new Date(today);
  mondayUTC.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart  = mondayUTC.toISOString().split("T")[0];

  const admin = createAdminClient();

  // ── Fetch all plans for this week ─────────────────────────────────────────
  const { data: plans, error: plansErr } = await admin
    .from("workout_plans")
    .select(`
      client_id,
      workout_days(id, day_of_week, is_rest, workout_completions(client_id))
    `)
    .eq("week_start", weekStart);

  if (plansErr) {
    return NextResponse.json({ error: plansErr.message }, { status: 500 });
  }

  type WD = { day_of_week: number; is_rest: boolean | null; workout_completions: { client_id: string }[] };

  // Fetch client lang preferences
  const clientIds = [...new Set((plans ?? []).map((p) => p.client_id))];
  const { data: clientProfiles } = await admin.from("profiles").select("id, lang").in("id", clientIds);
  const clientLangMap = new Map<string, "pt" | "en">(
    (clientProfiles ?? []).map((p) => [p.id, (p.lang === "en" ? "en" : "pt") as "pt" | "en"])
  );

  let sent = 0;
  let skipped = 0;
  const log: string[] = [];

  for (const plan of plans ?? []) {
    const todayDay = (plan.workout_days as WD[]).find(
      (d) => d.day_of_week === dayOfWeek && !d.is_rest
    );

    // No workout scheduled today for this client
    if (!todayDay) { skipped++; continue; }

    // Already completed — don't spam
    const alreadyDone = (todayDay.workout_completions).some(
      (c) => c.client_id === plan.client_id
    );
    if (alreadyDone) { skipped++; continue; }

    const cLang = clientLangMap.get(plan.client_id) ?? "pt";
    const result = await sendPushToUser(
      plan.client_id,
      cLang === "en" ? "💪 Time to train!" : "💪 Hora de treinar!",
      cLang === "en" ? "Today's workout is waiting for you. Let's go!" : "O teu treino de hoje está à tua espera. Vamos a isso!",
      "/client/dashboard",
    );

    if (result.ok) {
      sent++;
      log.push(`✓ ${plan.client_id}`);
    } else {
      log.push(`✗ ${plan.client_id}: ${result.error}`);
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    total: (plans ?? []).length,
    weekStart,
    dayOfWeek,
    log,
  });
}
