"use server";

import { createClient } from "@/lib/supabase/server";
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

  // Save lead to Supabase (upsert by email to avoid duplicates)
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("leads")
    .upsert({ name, email, source: "guia" }, { onConflict: "email" });

  if (dbError) {
    console.error("Lead DB error:", dbError);
    // Don't block the user — still send the email
  }

  // Send PDF via Resend
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "KRAV Coach <noreply@kravcoaching.com>",
    to: email,
    subject: `${name.split(" ")[0]}, o teu Guia de Treino está aqui 💪`,
    html: `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Guia de Treino KRAV</title>
</head>
<body style="margin:0;padding:0;background:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;">
    <tr>
      <td align="center" style="padding:48px 20px 48px;">

        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">

          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <span style="font-size:10px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:#C9A84C;">KRAV COACH</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f0f0f;border-radius:24px;border:1px solid rgba(201,168,76,0.2);overflow:hidden;">

              <!-- Header gradient -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1200 0%,#2e1f00 50%,#111 100%);padding:36px 36px 32px;text-align:center;">
                    <p style="margin:0 0 10px 0;font-size:10px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:rgba(201,168,76,0.6);">Download pronto</p>
                    <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.15;letter-spacing:-0.5px;">
                      O teu Guia de Treino<br/>está pronto, ${name.split(" ")[0]}.
                    </h1>
                  </td>
                </tr>

                <!-- Gold line -->
                <tr>
                  <td style="background:#0f0f0f;padding:0 36px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.25),transparent);"></div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="background:#0f0f0f;padding:28px 36px 12px;">
                    <p style="margin:0 0 28px 0;font-size:15px;color:#a1a1aa;line-height:1.7;">
                      Obrigado por pedires. Dentro do guia encontras o essencial para treinares de forma inteligente — sem perder tempo, sem complicar.
                    </p>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:28px;">
                          <a href="${PDF_LINK}" style="display:inline-block;background:linear-gradient(135deg,#E8C96B 0%,#C9A84C 55%,#A8893A 100%);color:#000000;font-size:15px;font-weight:900;text-decoration:none;padding:17px 44px;border-radius:14px;letter-spacing:0.02em;">
                            Abrir Guia de Treino &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <div style="height:1px;background:rgba(255,255,255,0.05);margin-bottom:24px;"></div>

                    <p style="margin:0 0 24px 0;font-size:13px;color:#52525b;line-height:1.6;">
                      Se quiseres resultados ainda mais rápidos com um plano feito a 100% para ti, tenho vagas de coaching online.
                    </p>

                    <!-- Secondary CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:32px;">
                          <a href="https://www.kravcoaching.com" style="display:inline-block;background:transparent;color:#C9A84C;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid rgba(201,168,76,0.3);letter-spacing:0.04em;">
                            Ver Coaching Online
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#0a0a0a;padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 24px 24px;">
                    <p style="margin:0;font-size:11px;color:#3f3f46;text-align:center;">
                      KRAV Coach &nbsp;·&nbsp;
                      <a href="https://www.kravcoaching.com" style="color:rgba(201,168,76,0.5);text-decoration:none;">kravcoaching.com</a>
                    </p>
                    <p style="margin:6px 0 0;font-size:11px;color:#27272a;text-align:center;">
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
