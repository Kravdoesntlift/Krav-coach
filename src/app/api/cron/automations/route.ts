import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * GET /api/cron/automations
 *
 * Evaluates all active coach automations and sends messages to clients
 * that match the trigger conditions. Should be called daily (e.g., 09:00 UTC).
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

  const admin = createAdminClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  // Current week Monday
  const mondayUTC = new Date(today);
  mondayUTC.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart = mondayUTC.toISOString().split("T")[0];

  // ── Fetch all active automations ─────────────────────────────────────────
  const { data: automations, error: autoErr } = await admin
    .from("coach_automations")
    .select("*")
    .eq("is_active", true);

  if (autoErr) {
    return NextResponse.json({ error: autoErr.message }, { status: 500 });
  }

  if (!automations || automations.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, skipped: 0 });
  }

  // ── Fetch today's logs (to avoid duplicates) ──────────────────────────────
  const { data: todayLogs } = await admin
    .from("coach_automation_logs")
    .select("automation_id, client_id")
    .gte("sent_at", `${todayStr}T00:00:00Z`)
    .lte("sent_at", `${todayStr}T23:59:59Z`);

  const sentToday = new Set<string>(
    (todayLogs ?? []).map((l) => `${l.automation_id}::${l.client_id}`)
  );

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const automation of automations) {
    // Get clients for this coach
    const { data: assignedRows } = await admin
      .from("coach_clients")
      .select("client_id")
      .eq("coach_id", automation.coach_id)
      .eq("assigned_role", "coach");

    const clientIds = (assignedRows ?? []).map((r) => r.client_id);

    if (clientIds.length === 0) {
      skipped++;
      continue;
    }

    // Fetch client profiles (for first name)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", clientIds);

    const profileMap = new Map<string, string>(
      (profiles ?? []).map((p) => [p.id, p.full_name])
    );

    for (const clientId of clientIds) {
      processed++;

      // Skip if already sent today
      const logKey = `${automation.id}::${clientId}`;
      if (sentToday.has(logKey)) {
        skipped++;
        continue;
      }

      // ── Evaluate trigger ──────────────────────────────────────────────────
      let shouldFire = false;

      if (automation.trigger_type === "no_workout_days") {
        // Find last workout completion for this client
        const { data: lastCompletion } = await admin
          .from("workout_completions")
          .select("created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastCompletion) {
          // Never completed a workout — fire
          shouldFire = true;
        } else {
          const lastDate = new Date(lastCompletion.created_at);
          const diffDays = Math.floor(
            (today.getTime() - lastDate.getTime()) / 86400000
          );
          shouldFire = diffDays > (automation.trigger_value ?? 3);
        }
      } else if (automation.trigger_type === "no_checkin_days") {
        const { data: lastCheckin } = await admin
          .from("weekly_checkins")
          .select("created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastCheckin) {
          shouldFire = true;
        } else {
          const lastDate = new Date(lastCheckin.created_at);
          const diffDays = Math.floor(
            (today.getTime() - lastDate.getTime()) / 86400000
          );
          shouldFire = diffDays > (automation.trigger_value ?? 7);
        }
      } else if (automation.trigger_type === "perfect_week") {
        // Only fires on Sunday (dayOfWeek === 0)
        if (dayOfWeek === 0) {
          // Get all workout days for this client this week
          const { data: weekPlan } = await admin
            .from("workout_plans")
            .select("workout_days(id, is_rest, workout_completions(client_id))")
            .eq("client_id", clientId)
            .eq("week_start", weekStart)
            .maybeSingle();

          if (weekPlan) {
            type WD = {
              id: string;
              is_rest: boolean | null;
              workout_completions: { client_id: string }[];
            };
            const days = (weekPlan.workout_days as WD[]) ?? [];
            const activeDays = days.filter((d) => !d.is_rest);
            const completedDays = activeDays.filter((d) =>
              d.workout_completions?.some((c) => c.client_id === clientId)
            );
            shouldFire =
              activeDays.length > 0 &&
              completedDays.length >= activeDays.length;
          }
        }
      } else if (automation.trigger_type === "checkin_monday") {
        // Only fires on Monday (dayOfWeek === 1)
        if (dayOfWeek === 1) {
          // Check if client already did check-in this week
          const { data: checkin } = await admin
            .from("weekly_checkins")
            .select("id")
            .eq("client_id", clientId)
            .eq("week_start", weekStart)
            .maybeSingle();

          // Fire if no check-in yet this week
          shouldFire = !checkin;
        }
      }

      if (!shouldFire) {
        skipped++;
        continue;
      }

      // ── Build message ─────────────────────────────────────────────────────
      const fullName = profileMap.get(clientId) ?? "";
      const firstName = fullName.split(" ")[0] || fullName;
      const content = automation.message_template.replace(
        /\{\{nome\}\}/gi,
        firstName
      );

      // ── Insert message ────────────────────────────────────────────────────
      const { error: msgErr } = await admin.from("messages").insert({
        sender_id: automation.coach_id,
        receiver_id: clientId,
        content,
      });

      if (msgErr) {
        console.error(
          `[automations] Failed to send message for automation ${automation.id} to ${clientId}:`,
          msgErr.message
        );
        skipped++;
        continue;
      }

      // ── Insert log ────────────────────────────────────────────────────────
      await admin.from("coach_automation_logs").insert({
        automation_id: automation.id,
        client_id: clientId,
        sent_at: new Date().toISOString(),
      });

      sentToday.add(logKey);
      sent++;
    }
  }

  // ── Monthly report push notifications (1st of each month) ────────────────
  if (today.getUTCDate() === 1) {
    const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const monthParam = `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, "0")}`;
    const MONTH_NAMES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const monthName = MONTH_NAMES_PT[lastMonth.getUTCMonth()];

    // Only notify clients that are actually assigned to a coach
    const { data: assignments } = await admin
      .from("coach_clients")
      .select("client_id");
    const assignedIds = [...new Set((assignments ?? []).map((r) => r.client_id))];
    const allClients = assignedIds.map((id) => ({ id }));

    if (allClients && allClients.length > 0) {
      await Promise.allSettled(
        allClients.map((client) =>
          sendPushToUser(
            client.id,
            "📊 O teu relatório mensal está pronto",
            `O relatório de ${monthName} já está disponível. Vê como foi o teu mês!`,
            `/client/report?m=${monthParam}`,
          )
        )
      );
    }
  }

  return NextResponse.json({ processed, sent, skipped });
}
