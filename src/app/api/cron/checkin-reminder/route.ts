import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * GET /api/cron/checkin-reminder
 *
 * Fires every Monday at 09:00 UTC. Sends a push notification to active clients
 * who haven't submitted a check-in for the current week yet.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const mondayUTC = new Date(today);
  mondayUTC.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  const weekStart = mondayUTC.toISOString().split("T")[0];

  const admin = createAdminClient();

  // All active clients who have a plan this week
  const { data: plans } = await admin
    .from("workout_plans")
    .select("client_id")
    .eq("week_start", weekStart);

  if (!plans?.length) return NextResponse.json({ sent: 0, skipped: 0 });

  const clientIds = [...new Set(plans.map((p) => p.client_id))];

  // Which of these already submitted a check-in this week?
  const { data: checkins } = await admin
    .from("weekly_checkins")
    .select("client_id")
    .eq("week_start", weekStart)
    .in("client_id", clientIds);

  const alreadyCheckedIn = new Set((checkins ?? []).map((c) => c.client_id));

  // Only notify active clients (not pending/paused/cancelled)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, status, lang")
    .in("id", clientIds)
    .eq("role", "client");

  const activeProfiles = (profiles ?? [])
    .filter((p) => (p.status === "active" || p.status === null) && !alreadyCheckedIn.has(p.id));

  let sent = 0;
  for (const profile of activeProfiles) {
    const cLang: "pt" | "en" = profile.lang === "en" ? "en" : "pt";
    const result = await sendPushToUser(
      profile.id,
      cLang === "en" ? "📋 Weekly check-in" : "📋 Check-in semanal",
      cLang === "en"
        ? "You haven't done your check-in this week yet. 2 minutes and it's done!"
        : "Ainda não fizeste o teu check-in desta semana. 2 minutos e está feito!",
      "/client/checkin",
    );
    if (result.ok) sent++;
  }

  return NextResponse.json({ sent, skipped: clientIds.length - activeProfiles.length, weekStart });
}
