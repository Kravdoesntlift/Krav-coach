import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

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
    .select("id, name, email, emails_sent, created_at")
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
    if (step === 0 && ageDays >= 3) {
      subject = "Já leste?";
      html = email2(firstName, unsubUrl);
    } else if (step === 1 && ageDays >= 7) {
      subject = "O Guilherme";
      html = email3(firstName, unsubUrl);
    } else if (step === 2 && ageDays >= 14) {
      subject = "último email";
      html = email4(firstName, unsubUrl);
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

/* ─── Email templates ─────────────────────────────────────────────────────────
   Intentionally plain — look like a personal email, not a newsletter.
   Short paragraphs, no images, no big headers.
────────────────────────────────────────────────────────────────────────────── */

function wrap(body: string, unsubUrl: string) {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f9f9f9">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
      <tr>
        <td bgcolor="#ffffff" style="background:#ffffff;border-radius:12px;padding:36px 36px 32px;border:1px solid #ebebeb;">
          <p style="margin:0 0 24px 0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#C9A84C;font-family:Helvetica,Arial,sans-serif;">KRAV COACH</p>
          ${body}
          <p style="margin:32px 0 0;font-size:12px;color:#bbb;font-family:Helvetica,Arial,sans-serif;border-top:1px solid #f0f0f0;padding-top:20px;line-height:1.6;">
            Recebeste este email porque pediste o guia gratuito em kravcoaching.com<br>
            <a href="${unsubUrl}" style="color:#bbb;text-decoration:underline;">Cancelar subscrição destes emails</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function p(text: string, style = "") {
  return `<p style="margin:0 0 18px 0;font-size:15px;color:#222222;line-height:1.7;font-family:Helvetica,Arial,sans-serif;${style}">${text}</p>`;
}

function link(href: string, text: string) {
  return `<a href="${href}" style="color:#C9A84C;text-decoration:none;font-weight:600;">${text}</a>`;
}

// ── Email 2: day 3 ────────────────────────────────────────────────────────────
function email2(firstName: string, unsubUrl: string) {
  return wrap(`
    ${p(`Olá ${firstName},`)}
    ${p("já tiveste tempo de abrir o guia?")}
    ${p("A maioria das pessoas descarrega, acha interessante e depois a vida continua igual. Não é falta de vontade. É que informação sozinha raramente muda alguma coisa.")}
    ${p(`Se quiseres falar sobre a tua situação, responde aqui ou fala comigo no Instagram ${link("https://www.instagram.com/kravdoesntlift", "@kravdoesntlift")}.`)}
    ${p("André", "margin-bottom:0;")}
  `, unsubUrl);
}

// ── Email 3: day 7 ────────────────────────────────────────────────────────────
function email3(firstName: string, unsubUrl: string) {
  return wrap(`
    ${p(`Olá ${firstName},`)}
    ${p("o Guilherme chegou ao meu coaching com 67kg. Já treinava há dois anos e sabia o que estava a fazer. Mas o corpo não respondia.")}
    ${p("Ganhou 20kg. Com o físico que sempre quis.")}
    ${p("Não foi magia. Foi ter alguém a olhar para os números todas as semanas e ajustar o plano de acordo com o que estava a funcionar para ele.")}
    ${p(`Se quiseres ser o próximo: ${link("https://www.kravcoaching.com", "kravcoaching.com")}`)}
    ${p("André", "margin-bottom:0;")}
  `, unsubUrl);
}

// ── Email 4: day 14 ───────────────────────────────────────────────────────────
function email4(firstName: string, unsubUrl: string) {
  return wrap(`
    ${p(`Olá ${firstName},`)}
    ${p("não te mando mais emails sobre coaching depois deste.")}
    ${p("Se ainda não avançaste é porque o momento não é o certo e não há problema nenhum nisso.")}
    ${p(`Mas se tens pensado nisso e só precisavas de um empurrão, as vagas que tenho são poucas e enchem depressa. Podes falar comigo aqui ou no ${link("https://www.instagram.com/kravdoesntlift", "Instagram")}.`)}
    ${p("André", "margin-bottom:0;")}
  `, unsubUrl);
}
