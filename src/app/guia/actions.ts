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
<html lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="supported-color-schemes" content="dark"/>
  <title>Guia de Treino KRAV</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0!important; padding:0!important; background-color:#080808!important; }
    .wrapper { background-color:#080808!important; }
    .card { background-color:#131313!important; }
    .header { background-color:#1c1400!important; }
    .body-cell { background-color:#131313!important; }
    .footer-cell { background-color:#0d0d0d!important; }
    .gold-line { background-color:#131313!important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#080808;" bgcolor="#080808">

<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#080808" style="background-color:#080808;min-height:100%;">
  <tr>
    <td align="center" style="padding:48px 16px;" bgcolor="#080808">

      <!-- Max width wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:460px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;" bgcolor="#080808">
            <p style="margin:0;font-size:10px;font-weight:900;letter-spacing:0.28em;text-transform:uppercase;color:#C9A84C;font-family:Helvetica,Arial,sans-serif;">KRAV COACH</p>
          </td>
        </tr>

        <!-- CARD outer -->
        <tr>
          <td class="card" bgcolor="#131313" style="background-color:#131313;border-radius:20px;border:1px solid #2a2008;overflow:hidden;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- Header dark gold -->
              <tr>
                <td class="header" bgcolor="#1c1400" style="background-color:#1c1400;padding:36px 32px 30px;text-align:center;border-radius:20px 20px 0 0;">
                  <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8a6f30;font-family:Helvetica,Arial,sans-serif;">Download pronto</p>
                  <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;font-family:Helvetica,Arial,sans-serif;">
                    O teu Guia de Treino<br/>está pronto, ${name.split(" ")[0]}.
                  </h1>
                </td>
              </tr>

              <!-- Gold separator -->
              <tr>
                <td class="gold-line" bgcolor="#131313" style="background-color:#131313;padding:0 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td bgcolor="#2e2006" style="background-color:#2e2006;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td class="body-cell" bgcolor="#131313" style="background-color:#131313;padding:28px 32px 8px;">
                  <p style="margin:0 0 24px 0;font-size:15px;color:#999999;line-height:1.7;font-family:Helvetica,Arial,sans-serif;">
                    Obrigado por pedires. Dentro do guia encontras o essencial para treinares de forma inteligente &mdash; sem perder tempo, sem complicar.
                  </p>

                  <!-- Main CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:24px;">
                        <a href="${PDF_LINK}" style="display:inline-block;background-color:#C9A84C;color:#000000;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:12px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.02em;">
                          Abrir Guia de Treino &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Separator -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                    <tr><td bgcolor="#222222" style="background-color:#222222;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>

                  <p style="margin:0 0 20px 0;font-size:13px;color:#555555;line-height:1.6;font-family:Helvetica,Arial,sans-serif;">
                    Se quiseres resultados ainda mais rápidos com um plano feito a 100% para ti, tenho vagas de coaching online.
                  </p>

                  <!-- Secondary CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom:28px;">
                        <a href="https://www.kravcoaching.com" style="display:inline-block;background-color:#1c1400;color:#C9A84C;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid #3a2c08;font-family:Helvetica,Arial,sans-serif;">
                          Ver Coaching Online
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td class="footer-cell" bgcolor="#0d0d0d" style="background-color:#0d0d0d;padding:18px 32px;border-top:1px solid #1f1f1f;border-radius:0 0 20px 20px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#444444;font-family:Helvetica,Arial,sans-serif;">
                    KRAV Coach &nbsp;&middot;&nbsp;
                    <a href="https://www.kravcoaching.com" style="color:#8a6f30;text-decoration:none;">kravcoaching.com</a>
                  </p>
                  <p style="margin:5px 0 0;font-size:11px;color:#333333;font-family:Helvetica,Arial,sans-serif;">
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
