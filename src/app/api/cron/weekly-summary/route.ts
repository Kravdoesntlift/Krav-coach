import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { sendWeeklySummaryEmail } from "@/lib/email";

/**
 * GET /api/cron/weekly-summary
 *
 * Fires every Sunday at 20:00 UTC.
 * Sends each active client a personalised push summary of their week:
 * workouts completed, check-in done, steps total, leaderboard position.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Week boundaries (Mon–Sun)
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = now.toISOString().slice(0, 10);

  // All active clients
  const { data: clients } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client")
    .or("status.is.null,status.eq.active");

  if (!clients?.length) return NextResponse.json({ sent: 0 });

  const clientIds = clients.map((c) => c.id);

  // Fetch emails from auth.users for the email summary
  const emailMap = new Map<string, string>();
  try {
    // listUsers returns up to 1000 by default; for larger deployments paginate
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
  } catch { /* non-critical — push still works without email */ }

  // Fetch all data for the week in parallel
  const [
    { data: completions },
    { data: checkins },
    { data: healthLogs },
    { data: nutritionLogs },
  ] = await Promise.all([
    admin
      .from("workout_completions")
      .select("client_id")
      .in("client_id", clientIds)
      .gte("completed_at", weekStart)
      .lte("completed_at", weekEnd),
    admin
      .from("weekly_checkins")
      .select("client_id")
      .in("client_id", clientIds)
      .eq("week_start", weekStart),
    admin
      .from("daily_health_logs")
      .select("client_id, steps")
      .in("client_id", clientIds)
      .gte("log_date", weekStart)
      .lte("log_date", weekEnd),
    admin
      .from("nutrition_logs")
      .select("client_id")
      .in("client_id", clientIds)
      .gte("logged_at", weekStart)
      .lte("logged_at", weekEnd),
  ]);

  // Build per-client stats
  const completionMap = new Map<string, number>();
  for (const c of completions ?? []) {
    completionMap.set(c.client_id, (completionMap.get(c.client_id) ?? 0) + 1);
  }
  const checkinSet = new Set((checkins ?? []).map((c) => c.client_id));
  const stepsMap = new Map<string, number>();
  for (const h of healthLogs ?? []) {
    stepsMap.set(h.client_id, (stepsMap.get(h.client_id) ?? 0) + (h.steps ?? 0));
  }
  const nutritionSet = new Set((nutritionLogs ?? []).map((n) => n.client_id));

  let sent = 0;
  for (const client of clients) {
    const workouts = completionMap.get(client.id) ?? 0;
    const didCheckin = checkinSet.has(client.id);
    const steps = stepsMap.get(client.id) ?? 0;
    const didNutrition = nutritionSet.has(client.id);

    // Skip if completely inactive this week
    if (workouts === 0 && !didCheckin && steps === 0) continue;

    // Build a concise, motivating message
    const parts: string[] = [];
    if (workouts > 0) parts.push(`${workouts} treino${workouts > 1 ? "s" : ""} ✅`);
    if (didCheckin) parts.push("check-in feito ✅");
    if (steps > 0) parts.push(`${(steps / 1000).toFixed(1)}k passos 👟`);
    if (didNutrition) parts.push("nutrição registada 🥗");

    const firstName = client.full_name?.split(" ")[0] ?? "Atleta";
    const score = workouts * 10 + (didCheckin ? 15 : 0) + Math.floor(steps / 1000) * 2 + (didNutrition ? 5 : 0);

    const title = score >= 30 ? `🔥 Semana incrível, ${firstName}!` : `📊 Resumo da semana, ${firstName}`;
    const body = parts.length > 0
      ? parts.join(" · ")
      : "Começa a semana que vem mais forte 💪";

    const result = await sendPushToUser(client.id, title, body, "/client/progress");
    if (result.ok) sent++;

    // Also send email summary (fire-and-forget, non-critical)
    const clientEmail = emailMap.get(client.id);
    if (clientEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://kravcoaching.com");
      sendWeeklySummaryEmail({
        to: clientEmail,
        clientName: client.full_name ?? "Atleta",
        weekStart,
        weekEnd,
        workouts,
        didCheckin,
        steps,
        didNutrition,
        score,
        siteUrl,
      }).catch((e) => console.warn("[weekly-summary] email failed:", e));
    }
  }

  return NextResponse.json({ sent, total: clients.length, weekStart });
}
