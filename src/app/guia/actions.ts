"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { Resend } from "resend";
import { redirect } from "next/navigation";
import { guidePdfPath, type GuideVariant } from "@/lib/guide/content";
import type { Lang } from "@/lib/training/base-plan";

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE = "https://www.kravcoaching.com";

/**
 * Where someone trains decides which guide they get. Outdoors goes with the
 * home version: both are built on bodyweight and a band, not on machines.
 */
function variantFor(place: string | null): GuideVariant {
  return place === "home" || place === "outdoor" ? "home" : "gym";
}

/**
 * The lead table has no column for language or for which guide was sent, and
 * this project has no way to add one from here. `source` is free text that
 * nothing else reads, so it carries both: "guia:home:en".
 */
function sourceFor(variant: GuideVariant, lang: Lang, place: string): string {
  return `guia:${variant}:${lang}:${place}`;
}

const EMAIL = {
  subject: {
    pt: (first: string) => `${first}, o teu Guia de Treino está aqui 💪`,
    en: (first: string) => `${first}, your training guide is here 💪`,
  },
  kicker: { pt: "Download pronto", en: "Your download is ready" },
  heading: {
    pt: (first: string) => `O teu Guia de Treino<br/>está pronto, ${first}.`,
    en: (first: string) => `Your training guide<br/>is ready, ${first}.`,
  },
  intro: {
    gym: {
      pt: "Obrigado por pedires. Lá dentro está o método completo e o plano de 5 dias no ginásio, exercício a exercício.",
      en: "Thanks for asking. Inside you will find the full method and the 5 day gym plan, exercise by exercise.",
    },
    home: {
      pt: "Obrigado por pedires. Como treinas fora do ginásio, este é o guia com o plano de 5 dias em casa, feito para peso corporal, halteres ou banda elástica.",
      en: "Thanks for asking. Since you train outside a gym, this is the guide with the 5 day home plan, built for bodyweight, dumbbells or a band.",
    },
  },
  cta: { pt: "Abrir Guia de Treino →", en: "Open the training guide →" },
  secondaryIntro: {
    pt: "Este guia é o método. Se quiseres um plano escrito para ti e ajustado todas as semanas, tens 7 dias grátis para experimentar.",
    en: "This guide is the method. If you want a plan written for you and adjusted every week, you have 7 free days to try it.",
  },
  secondaryCta: { pt: "Experimentar 7 dias grátis", en: "Try 7 days free" },
  footerWhy: {
    pt: "Recebeste este email porque pediste o guia gratuito.",
    en: "You are receiving this because you asked for the free guide.",
  },
  error: {
    pt: "Erro ao enviar o email. Tenta de novo.",
    en: "Could not send the email. Please try again.",
  },
  invalid: {
    pt: "Preenche todos os campos corretamente.",
    en: "Please fill in every field correctly.",
  },
} as const;

function emailHtml(args: { first: string; lang: Lang; variant: GuideVariant; pdfUrl: string }) {
  const { first, lang, variant, pdfUrl } = args;
  const startUrl = lang === "en" ? `${SITE}/start?lang=en` : `${SITE}/start`;

  return `
<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>KRAV Coach</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;" bgcolor="#f5f0e8">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f0e8" style="background-color:#f5f0e8;">
  <tr>
    <td align="center" style="padding:40px 16px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

        <tr>
          <td align="center" style="padding-bottom:20px;">
            <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:#8a6820;font-family:Helvetica,Arial,sans-serif;">KRAV COACH</p>
          </td>
        </tr>

        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8e0d0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">

              <tr>
                <td bgcolor="#0f0a00" style="background-color:#0f0a00;padding:40px 36px 36px;text-align:center;">
                  <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#C9A84C;font-family:Helvetica,Arial,sans-serif;">
                    ${EMAIL.kicker[lang]}
                  </p>
                  <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.2;font-family:Helvetica,Arial,sans-serif;letter-spacing:-0.3px;">
                    ${EMAIL.heading[lang](first)}
                  </h1>
                </td>
              </tr>

              <tr>
                <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="#C9A84C" style="background-color:#C9A84C;height:2px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px 36px 12px;">
                  <p style="margin:0 0 28px 0;font-size:15px;color:#555555;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
                    ${EMAIL.intro[variant][lang]}
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <a href="${pdfUrl}" style="display:inline-block;background-color:#0f0a00;color:#C9A84C;font-size:15px;font-weight:900;text-decoration:none;padding:18px 44px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.04em;">
                          ${EMAIL.cta[lang]}
                        </a>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                    <tr><td bgcolor="#f0ebe0" style="background-color:#f0ebe0;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>

                  <p style="margin:0 0 20px 0;font-size:13px;color:#999999;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
                    ${EMAIL.secondaryIntro[lang]}
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:32px;">
                        <a href="${startUrl}" style="display:inline-block;background-color:#ffffff;color:#8a6820;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid #c9a84c;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.04em;">
                          ${EMAIL.secondaryCta[lang]}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td bgcolor="#faf7f2" style="background-color:#faf7f2;padding:18px 36px;border-top:1px solid #ede8dc;text-align:center;border-radius:0 0 20px 20px;">
                  <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Helvetica,Arial,sans-serif;">
                    KRAV Coach &nbsp;&middot;&nbsp;
                    <a href="${SITE}" style="color:#C9A84C;text-decoration:none;">kravcoaching.com</a>
                  </p>
                  <p style="margin:5px 0 0;font-size:11px;color:#cccccc;font-family:Helvetica,Arial,sans-serif;">
                    ${EMAIL.footerWhy[lang]}
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
  `.trim();
}

export async function submitGuiaForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const place = ((formData.get("place") as string) ?? "gym").trim();
  const lang: Lang = formData.get("lang") === "en" ? "en" : "pt";

  if (!name || !email || !email.includes("@")) {
    return { error: EMAIL.invalid[lang] };
  }

  const variant = variantFor(place);
  const pdfUrl = `${SITE}${guidePdfPath(variant, lang)}`;

  // Save lead to Supabase: ignore duplicate emails, never block the user
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("leads")
    .insert({ name, email, source: sourceFor(variant, lang, place) });

  if (dbError && !dbError.message?.includes("duplicate") && !dbError.code?.includes("23505")) {
    console.error("Lead DB error:", dbError.message, dbError.code);
  }

  // Notify all coaches via push (fire-and-forget)
  if (!dbError) {
    const admin = createAdminClient();
    const { data: coaches } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "coach");

    if (coaches?.length) {
      const where = place === "gym" ? "ginásio" : place === "home" ? "casa" : "ar livre";
      await Promise.all(
        coaches.map((c) =>
          sendPushToUser(
            c.id,
            "🔥 Novo lead!",
            `${name} pediu o guia gratuito (${where})`,
            "/coach/leads",
          )
        )
      );
    }
  }

  const first = name.split(" ")[0];
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "KRAV Coach <noreply@kravcoaching.com>",
    to: email,
    subject: EMAIL.subject[lang](first),
    html: emailHtml({ first, lang, variant, pdfUrl }),
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    return { error: EMAIL.error[lang] };
  }

  redirect(lang === "en" ? "/guia/obrigado?lang=en" : "/guia/obrigado");
}
