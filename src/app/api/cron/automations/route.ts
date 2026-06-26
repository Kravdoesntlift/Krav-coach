import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { sendTrialReminderEmail, sendRenewalReminderEmail } from "@/lib/email";

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

    // Fetch client profiles (for first name + lang)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, lang")
      .in("id", clientIds);

    const profileMap = new Map<string, string>(
      (profiles ?? []).map((p) => [p.id, p.full_name])
    );
    const langMap = new Map<string, "pt" | "en">(
      (profiles ?? []).map((p) => [p.id, (p.lang === "en" ? "en" : "pt") as "pt" | "en"])
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
        /\{\{nome\}\}|\{\{name\}\}/gi,
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
    const MONTH_NAMES_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthIdx = lastMonth.getUTCMonth();

    // Only notify clients that are actually assigned to a coach
    const { data: assignments } = await admin.from("coach_clients").select("client_id");
    const assignedIds = [...new Set((assignments ?? []).map((r) => r.client_id))];

    // Fetch langs for these clients
    const { data: clientProfiles } = await admin.from("profiles").select("id, lang").in("id", assignedIds);
    const clientLangMap = new Map<string, "pt" | "en">(
      (clientProfiles ?? []).map((p) => [p.id, (p.lang === "en" ? "en" : "pt") as "pt" | "en"])
    );

    if (assignedIds.length > 0) {
      await Promise.allSettled(
        assignedIds.map((id) => {
          const cLang = clientLangMap.get(id) ?? "pt";
          const monthName = cLang === "en" ? MONTH_NAMES_EN[monthIdx] : MONTH_NAMES_PT[monthIdx];
          return sendPushToUser(
            id,
            cLang === "en" ? "📊 Your monthly report is ready" : "📊 O teu relatório mensal está pronto",
            cLang === "en"
              ? `The ${monthName} report is now available. See how your month went!`
              : `O relatório de ${monthName} já está disponível. Vê como foi o teu mês!`,
            `/client/report?m=${monthParam}`,
          );
        })
      );
    }
  }

  // ── Trial expiry warnings (2 days left = day 5, 1 day left = day 6) ────────
  // Use midnight-to-midnight UTC windows so clients who registered at any hour
  // of the day are caught regardless of when the cron fires.
  const trialWarningDays = [2, 1];
  for (const daysLeft of trialWarningDays) {
    const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysLeft));
    const windowEnd   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysLeft + 1));

    const { data: expiringClients } = await admin
      .from("profiles")
      .select("id, full_name, lang")
      .eq("role", "client")
      .eq("status", "active")
      .gt("trial_ends_at", windowStart.toISOString())
      .lt("trial_ends_at", windowEnd.toISOString());

    if (!expiringClients?.length) continue;

    // Skip clients already subscribed
    const { data: activeSubs } = await admin
      .from("stripe_subscriptions")
      .select("client_id")
      .in("client_id", expiringClients.map((c) => c.id))
      .in("status", ["active", "trialing"]);
    const subSet = new Set((activeSubs ?? []).map((s) => s.client_id));
    const toWarn = expiringClients.filter((c) => !subSet.has(c.id));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

    await Promise.allSettled(
      toWarn.flatMap((c) => {
        const cLang: "pt" | "en" = (c as { lang?: string }).lang === "en" ? "en" : "pt";
        return [
          // Push notification (language-aware)
          sendPushToUser(
            c.id,
            cLang === "en"
              ? (daysLeft === 1 ? "⏰ Last day of trial!" : "⚠️ Your trial ends in 2 days")
              : (daysLeft === 1 ? "⏰ Último dia de trial!" : "⚠️ O teu trial termina em 2 dias"),
            cLang === "en"
              ? (daysLeft === 1 ? "Don't lose access. Subscribe now." : "You still have 2 days. Activate your subscription and continue.")
              : (daysLeft === 1 ? "Não percas o acesso. Subscreve agora." : "Ainda tens 2 dias. Activa a tua subscrição e continua."),
            "/client/dashboard",
          ),
          // Email (language-aware)
          admin.auth.admin.getUserById(c.id).then(({ data }) => {
            const email = data?.user?.email;
            if (!email) return;
            return sendTrialReminderEmail({
              to: email,
              clientName: c.full_name ?? "",
              daysLeft,
              siteUrl,
              lang: cLang,
            });
          }),
        ];
      })
    );
  }

  // ── Subscription renewal reminder (3 days before period end) ────────────────
  const renewalWindow = new Date(today.getTime() + 3 * 86_400_000);
  const renewalWindowEnd = new Date(today.getTime() + 4 * 86_400_000);

  const { data: renewingSubs } = await admin
    .from("stripe_subscriptions")
    .select("client_id, current_period_end")
    .in("status", ["active", "trialing"])
    .gt("current_period_end", renewalWindow.toISOString())
    .lt("current_period_end", renewalWindowEnd.toISOString());

  if (renewingSubs?.length) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";
    await Promise.allSettled(
      renewingSubs.map(async (sub) => {
        const clientId = sub.client_id;
        const [{ data: prof }, { data: authUser }] = await Promise.all([
          admin.from("profiles").select("full_name, lang").eq("id", clientId).single(),
          admin.auth.admin.getUserById(clientId),
        ]);
        const email = authUser?.user?.email;
        const clientName = prof?.full_name ?? "";
        const cLang: "pt" | "en" = prof?.lang === "en" ? "en" : "pt";
        const locale = cLang === "en" ? "en-GB" : "pt-PT";
        const renewalDate = new Date(sub.current_period_end!).toLocaleDateString(locale, {
          day: "numeric", month: "long",
        });

        await Promise.allSettled([
          sendPushToUser(
            clientId,
            cLang === "en" ? "💳 Your plan renews in 3 days" : "💳 O teu plano renova em 3 dias",
            cLang === "en"
              ? `Renews on ${renewalDate}. Confirm your card is up to date.`
              : `Renova a ${renewalDate}. Confirma que o teu cartão está actualizado.`,
            "/client/profile",
          ),
          email && sendRenewalReminderEmail({ to: email, clientName, renewalDate, siteUrl, lang: cLang }),
        ]);
      })
    );
  }

  return NextResponse.json({ processed, sent, skipped });
}
