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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Guia de Treino KRAV</title>
</head>
<body style="margin:0;padding:0;background:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" style="max-width:480px;background:#0f0f0f;border-radius:20px;border:1px solid rgba(201,168,76,0.2);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1200,#2e1f00,#0d0d0d);padding:36px 32px 28px;text-align:center;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:0.22em;text-transform:uppercase;color:#C9A84C;">KRAV COACH</p>
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff;line-height:1.2;">O teu Guia de Treino<br/>está pronto, ${name.split(" ")[0]}.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Obrigado por pedires. Dentro do guia vais encontrar o essencial para treinares de forma inteligente — sem perder tempo, sem complicar.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${PDF_LINK}"
                      style="display:inline-block;background:linear-gradient(135deg,#E8C96B,#C9A84C,#A8893A);color:#000;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:14px;letter-spacing:0.02em;">
                      Abrir Guia de Treino →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#71717a;line-height:1.6;">
                Se gostares do guia e quiseres resultados ainda mais rápidos, tenho vagas abertas para coaching online personalizado — treino e nutrição feitos a 100% para ti.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                KRAV Coach · <a href="https://www.kravcoaching.com" style="color:#C9A84C;text-decoration:none;">kravcoaching.com</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#3f3f46;">
                Recebeste este email porque pediste o guia gratuito.
              </p>
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
