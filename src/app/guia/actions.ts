"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { Resend } from "resend";
import { redirect } from "next/navigation";

const resend = new Resend(process.env.RESEND_API_KEY);

const PDF_LINK = "https://drive.google.com/file/d/1j0sW0sdZ3p4Mo859x6haPW-yb2TBB81g/view?usp=sharing";

export async function submitGuiaForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!name || !email || !email.includes("@")) {
    return { error: "Preenche todos os campos corretamente." };
  }

  // Save lead to Supabase — ignore duplicate emails, never block the user
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("leads")
    .insert({ name, email, source: "guia" });

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
      await Promise.all(
        coaches.map((c) =>
          sendPushToUser(
            c.id,
            "🔥 Novo lead!",
            `${name} pediu o guia gratuito`,
            "/coach/leads",
          )
        )
      );
    }
  }

  // Send PDF via Resend
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "KRAV Coach <noreply@kravcoaching.com>",
    to: email,
    subject: `${name.split(" ")[0]}, o teu Guia de Treino está aqui 💪`,
    html: `
<!DOCTYPE html>
<html lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Guia de Treino KRAV</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;" bgcolor="#f5f0e8">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f0e8" style="background-color:#f5f0e8;">
  <tr>
    <td align="center" style="padding:40px 16px 48px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">

        <!-- Brand mark -->
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:#8a6820;font-family:Helvetica,Arial,sans-serif;">KRAV COACH</p>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8e0d0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- Header — rich dark -->
              <tr>
                <td bgcolor="#0f0a00" style="background-color:#0f0a00;padding:40px 36px 36px;text-align:center;">
                  <p style="margin:0 0 10px 0;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#C9A84C;font-family:Helvetica,Arial,sans-serif;">
                    Download pronto
                  </p>
                  <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.2;font-family:Helvetica,Arial,sans-serif;letter-spacing:-0.3px;">
                    O teu Guia de Treino<br/>está pronto, ${name.split(" ")[0]}.
                  </h1>
                </td>
              </tr>

              <!-- Gold line -->
              <tr>
                <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="#C9A84C" style="background-color:#C9A84C;height:2px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px 36px 12px;">
                  <p style="margin:0 0 28px 0;font-size:15px;color:#555555;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
                    Obrigado por pedires. Dentro do guia encontras o essencial para treinares de forma inteligente &mdash; sem perder tempo, sem complicar.
                  </p>

                  <!-- Main CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <a href="${PDF_LINK}" style="display:inline-block;background-color:#0f0a00;color:#C9A84C;font-size:15px;font-weight:900;text-decoration:none;padding:18px 44px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.04em;">
                          Abrir Guia de Treino &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                    <tr><td bgcolor="#f0ebe0" style="background-color:#f0ebe0;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>

                  <p style="margin:0 0 20px 0;font-size:13px;color:#999999;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
                    Se quiseres resultados ainda mais rápidos com um plano feito a 100% para ti, tenho vagas de coaching online.
                  </p>

                  <!-- Secondary CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:32px;">
                        <a href="https://www.kravcoaching.com" style="display:inline-block;background-color:#ffffff;color:#8a6820;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid #c9a84c;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.04em;">
                          Ver Coaching Online
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#faf7f2" style="background-color:#faf7f2;padding:18px 36px;border-top:1px solid #ede8dc;text-align:center;border-radius:0 0 20px 20px;">
                  <p style="margin:0;font-size:11px;color:#aaaaaa;font-family:Helvetica,Arial,sans-serif;">
                    KRAV Coach &nbsp;&middot;&nbsp;
                    <a href="https://www.kravcoaching.com" style="color:#C9A84C;text-decoration:none;">kravcoaching.com</a>
                  </p>
                  <p style="margin:5px 0 0;font-size:11px;color:#cccccc;font-family:Helvetica,Arial,sans-serif;">
                    Recebeste este email porque pediste o guia gratuito.
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
    `.trim(),
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    return { error: "Erro ao enviar o email. Tenta de novo." };
  }

  redirect("/guia/obrigado");
}
