import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { SUBJECTS, email2, email3, email4 } from "@/lib/emails/lead-drip";

/**
 * GET /api/cron/leads-drip
 *
 * Sends a 3-email follow-up sequence to leads who downloaded the free guide.
 * Runs daily at 10:00 UTC. Tracks progress via `emails_sent` column on leads.
 *
 *   emails_sent = 0  →  send email 2 if lead is ≥ 3 days old
 *   emails_sent = 1  →  send email 3 if lead is ≥ 7 days old
 *   emails_sent = 2  →  send email 4 if lead is ≥ 14 days old
 *   emails_sent = 3  →  sequence complete, never touched again
 */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret)
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM ?? "André · KRAV Coaching <andre@kravcoaching.com>";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

  // ── Fetch eligible leads ───────────────────────────────────────────────────
  // For each step, grab leads that have reached the right age AND haven't had
  // that email sent yet. We process all three steps in a single DB round-trip.
  const { data: leads, error: dbErr } = await admin
    .from("leads")
    .select("id, name, email, emails_sent, created_at, source")
    .lte("created_at", daysAgo(3)) // at minimum 3 days old
    .lt("emails_sent", 3)          // sequence not yet complete
    .is("unsubscribed_at", null)   // GDPR: skip unsubscribed leads
    .order("created_at", { ascending: true });

  if (dbErr) {
    console.error("[leads-drip] DB error:", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const results = { email2: 0, email3: 0, email4: 0, skipped: 0, errors: 0 };

  for (const lead of leads ?? []) {
    const firstName = lead.name.split(" ")[0];
    const ageDays = (now.getTime() - new Date(lead.created_at).getTime()) / 86_400_000;
    const step = lead.emails_sent as number;

    // Determine which email to send
    let subject = "";
    let html = "";

    const unsubUrl = `${SITE_URL}/api/unsubscribe?id=${lead.id}`;
    // The guide form records the language in `source` ("guia:home:en:..."),
    // because the leads table has no column for it. A lead who asked in
    // English gets the follow-ups in English.
    const lang: "pt" | "en" = String(lead.source ?? "").split(":")[2] === "en" ? "en" : "pt";

    if (step === 0 && ageDays >= 3) {
      subject = SUBJECTS[0][lang];
      html = email2(firstName, unsubUrl, lang);
    } else if (step === 1 && ageDays >= 7) {
      subject = SUBJECTS[1][lang];
      html = email3(firstName, unsubUrl, lang);
    } else if (step === 2 && ageDays >= 14) {
      subject = SUBJECTS[2][lang];
      html = email4(firstName, unsubUrl, lang);
    } else {
      results.skipped++;
      continue;
    }

    // Send
    const { error: emailErr } = await resend.emails.send({
      from: FROM,
      to: lead.email,
      subject,
      html,
    });

    if (emailErr) {
      console.error(`[leads-drip] Resend error for ${lead.email}:`, emailErr);
      results.errors++;
      continue;
    }

    // Mark as sent
    await admin
      .from("leads")
      .update({ emails_sent: step + 1 })
      .eq("id", lead.id);

    if (step === 0) results.email2++;
    if (step === 1) results.email3++;
    if (step === 2) results.email4++;
  }

  console.log("[leads-drip]", results);
  return NextResponse.json({ ok: true, ...results });
}
