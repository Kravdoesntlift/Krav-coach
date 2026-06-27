import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "André · KRAV Coaching <andre@kravcoaching.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Wrapper that logs and throws on Resend API errors instead of silently swallowing them
async function sendEmail(payload: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
  const { error } = await getResend().emails.send(payload);
  if (error) {
    const to = Array.isArray(payload.to) ? payload.to.join(",") : payload.to;
    console.error(`[email] Resend error sending to ${to} (subject: "${payload.subject}"):`, error);
    throw new Error(`Email send failed: ${(error as { message?: string }).message ?? JSON.stringify(error)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice email
// ─────────────────────────────────────────────────────────────────────────────
export async function sendInvoiceEmail({
  to, clientName, amountEur, periodEnd, invoiceNumber, lang = "pt",
}: {
  to: string; clientName: string; amountEur: string; periodEnd: string;
  invoiceNumber: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const isEN = lang === "en";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#C9A84C;margin:0">KRAV.</p>
      <p style="color:#71717a;font-size:13px;margin:6px 0 0">Premium Coaching</p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px">
      <p style="color:#71717a;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">${isEN ? "Payment Receipt" : "Recibo de Pagamento"}</p>
      <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 24px">${isEN ? `Hi, ${clientName}!` : `Olá, ${clientName}!`}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">
        ${isEN ? "Your payment was processed successfully. Here is your receipt." : "O teu pagamento foi processado com sucesso. Aqui está o teu recibo."}
      </p>
      <div style="background:#0a0a0c;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">${isEN ? "Reference" : "Referência"}</td>
              <td style="color:#e4e4e7;font-size:13px;text-align:right;font-family:monospace">${invoiceNumber}</td></tr>
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">${isEN ? "Service" : "Serviço"}</td>
              <td style="color:#e4e4e7;font-size:13px;text-align:right">KRAV Premium Coaching</td></tr>
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">${isEN ? "Next renewal" : "Próxima renovação"}</td>
              <td style="color:#e4e4e7;font-size:13px;text-align:right">${periodEnd}</td></tr>
          <tr style="border-top:1px solid #27272a">
            <td style="color:#fff;font-size:16px;font-weight:700;padding:12px 0 0">${isEN ? "Total paid" : "Total pago"}</td>
            <td style="color:#C9A84C;font-size:20px;font-weight:900;text-align:right;padding-top:12px">${amountEur}</td>
          </tr>
        </table>
      </div>
      <p style="color:#52525b;font-size:12px;line-height:1.6;margin:0">
        ${isEN
          ? `Access your client area at <a href="https://kravcoaching.com/client/dashboard" style="color:#C9A84C">kravcoaching.com</a>. For billing questions, contact <a href="mailto:kravdoesntlift@gmail.com" style="color:#C9A84C">kravdoesntlift@gmail.com</a>.`
          : `Podes aceder à tua área de cliente em <a href="https://kravcoaching.com/client/dashboard" style="color:#C9A84C">kravcoaching.com</a>. Para questões de faturação, contacta <a href="mailto:kravdoesntlift@gmail.com" style="color:#C9A84C">kravdoesntlift@gmail.com</a>.`}
      </p>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:24px 0">
      © ${new Date().getFullYear()} KRAV Coaching · kravcoaching.com
    </p>
  </div>
</body>
</html>`;

  await sendEmail({
    from: FROM, to,
    subject: isEN ? `KRAV Coaching Receipt — ${amountEur}` : `Recibo KRAV Coaching — ${amountEur}`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment failed email
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPaymentFailedEmail({
  to, clientName, amountEur, lang = "pt",
}: {
  to: string; clientName: string; amountEur: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const isEN = lang === "en";
  const firstName = clientName.split(" ")[0];

  await sendEmail({
    from: FROM, to,
    subject: isEN ? `Problem with your KRAV payment` : `Problema com o teu pagamento KRAV`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:22px;font-weight:900;color:#C9A84C;margin:0">KRAV.</p>
    </div>
    <div style="background:#111113;border:1px solid #3f3f46;border-radius:20px;padding:32px">
      <p style="color:#f87171;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">${isEN ? "Payment failed" : "Pagamento falhado"}</p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 16px">${isEN ? `Hi, ${firstName}` : `Olá, ${firstName}`}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">
        ${isEN
          ? `We couldn't process your payment of <strong style="color:#fff">${amountEur}</strong>. Please update your payment details to keep access to coaching.`
          : `Não foi possível processar o teu pagamento de <strong style="color:#fff">${amountEur}</strong>. Por favor atualiza os teus dados de pagamento para manter o acesso ao coaching.`}
      </p>
      <a href="https://kravcoaching.com/client/dashboard" style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
        ${isEN ? "Update payment method" : "Atualizar método de pagamento"}
      </a>
    </div>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome email — sent on first signup
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to, clientName, coachName, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; coachName: string; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const coachFirst = coachName.split(" ")[0] || "Coach";
  const isEN = lang === "en";

  const steps = isEN
    ? [
        ["1", "Complete your profile", "Fill in your data (weight, height, goal) so the coach can personalise your plan."],
        ["2", "Explore the app", "Check out the workouts, log check-ins and use the chat to talk directly with your coach."],
        ["3", "Install on your phone", "Open the site in Safari/Chrome and use 'Add to Home Screen' for native access."],
      ]
    : [
        ["1", "Completa o teu perfil", "Preenche os teus dados (peso, altura, objetivo) para o coach personalizar o teu plano."],
        ["2", "Explora a app", "Vê os treinos, regista check-ins e usa o chat para falar directamente com o teu coach."],
        ["3", "Instala no telemóvel", "Abre o site no Safari/Chrome e usa 'Adicionar ao ecrã de início' para acesso nativo."],
      ];

  await sendEmail({
    from: FROM, to,
    subject: isEN ? `Welcome to KRAV, ${firstName}! 🏆` : `Bem-vindo(a) ao KRAV, ${firstName}! 🏆`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
      <p style="color:#71717a;font-size:13px;margin:6px 0 0">Premium Coaching</p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:36px;margin-bottom:20px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#E8C96B,#A8893A);border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:28px">🏆</div>
      </div>
      <h1 style="color:#fff;font-size:26px;font-weight:900;text-align:center;margin:0 0 12px">
        ${isEN ? `Welcome, ${firstName}!` : `Bem-vindo(a), ${firstName}!`}
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;text-align:center;margin:0 0 8px">
        ${isEN
          ? `Welcome to your <strong style="color:#C9A84C">free 7-day trial</strong>. You have full access to the app this week.`
          : `Bem-vindo ao teu <strong style="color:#C9A84C">trial gratuito de 7 dias</strong>. Tens acesso completo à app durante esta semana.`}
      </p>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;text-align:center;margin:0 0 28px">
        ${isEN
          ? `Your coach <strong style="color:#fff">${coachFirst}</strong> will prepare your training plan soon. Any questions, message directly via chat.`
          : `O teu coach <strong style="color:#fff">${coachFirst}</strong> vai preparar o teu plano de treino em breve. Qualquer dúvida, fala directamente por chat.`}
      </p>
      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:14px 24px;border-radius:14px;text-decoration:none;text-align:center">
        ${isEN ? "Go to my area →" : "Aceder à minha área →"}
      </a>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:28px;margin-bottom:20px">
      <p style="color:#71717a;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px">
        ${isEN ? "Next steps" : "Os próximos passos"}
      </p>
      ${steps.map(([n, title, desc]) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px">
          <tr>
            <td width="46" style="vertical-align:top;padding-right:14px">
              <div style="width:32px;height:32px;background:#1a1207;border:1.5px solid #C9A84C;border-radius:50%;display:inline-block;line-height:29px;text-align:center;color:#C9A84C;font-weight:900;font-size:13px">${n}</div>
            </td>
            <td style="vertical-align:top">
              <p style="color:#fff;font-weight:700;font-size:14px;margin:0 0 3px">${title}</p>
              <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0">${desc}</p>
            </td>
          </tr>
        </table>
      `).join("")}
    </div>
    <div style="background:#0e1a0e;border:1px solid #1a3a1a;border-radius:14px;padding:16px 20px;margin-bottom:24px">
      <p style="color:#4ade80;font-size:13px;margin:0">
        💡 <strong>${isEN ? "Install on your phone:" : "Instalar no telemóvel:"}</strong>
        ${isEN
          ? `Open <a href="${siteUrl}" style="color:#4ade80">${siteUrl.replace("https://","")}</a> in Safari/Chrome and use "Add to Home Screen".`
          : `Abre <a href="${siteUrl}" style="color:#4ade80">${siteUrl.replace("https://","")}</a> no Safari/Chrome e usa "Adicionar ao ecrã de início".`}
      </p>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      ${isEN ? `Sent by ${coachFirst} · KRAV Coaching` : `Enviado por ${coachFirst} · KRAV Coaching`}<br>
      <a href="${siteUrl}/client/dashboard" style="color:#52525b">${isEN ? "Access the app" : "Aceder à app"}</a> ·
      <a href="mailto:${process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] ?? "kravdoesntlift@gmail.com"}" style="color:#52525b">${isEN ? "Contact support" : "Contactar suporte"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial reminder email — sent day 5 and day 6 of trial
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTrialReminderEmail({
  to, clientName, daysLeft, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; daysLeft: number; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isLast = daysLeft === 1;
  const isEN = lang === "en";

  const subject = isEN
    ? (isLast ? `${firstName}, your trial ends tomorrow` : `${firstName}, ${daysLeft} days left on your trial`)
    : (isLast ? `${firstName}, o teu trial termina amanhã` : `${firstName}, faltam ${daysLeft} dias do teu trial`);

  const features = isEN
    ? [
        ["Personalised weekly training plans", "✓"],
        ["Progress & evolution check-ins", "✓"],
        ["Nutrition and adapted macros", "✓"],
        ["Direct coach access via chat", "✓"],
      ]
    : [
        ["Planos de treino semanais personalizados", "✓"],
        ["Check-ins de evolução e progresso", "✓"],
        ["Nutrição e macros adaptados", "✓"],
        ["Acesso direto ao coach via chat", "✓"],
      ];

  await sendEmail({
    from: FROM, to, subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px;margin-bottom:16px">
      <p style="color:#C9A84C;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px">
        ${isEN
          ? (isLast ? "Last day of trial" : `${daysLeft} days remaining`)
          : (isLast ? "Último dia de trial" : `${daysLeft} dias restantes`)}
      </p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 16px">${isEN ? `Hi ${firstName},` : `Olá ${firstName},`}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        ${isEN
          ? (isLast
            ? `Your trial ends tomorrow. Everything you logged stays saved. If you want to keep access to your training plan, coach messages and progress history, activate your subscription now.`
            : `Your trial ends in ${daysLeft} days. You already have access to your training plan, coach and full progress record. Don't lose that access.`)
          : (isLast
            ? `O teu trial termina amanhã. Tudo o que registaste fica guardado. Se quiseres continuar a ter acesso ao teu plano de treino, às mensagens do coach e ao histórico de progresso, activa a subscrição agora.`
            : `O teu trial termina em ${daysLeft} dias. Até agora já tens acesso ao teu plano de treino, ao coach e a todo o registo de progresso. Não percas esse acesso.`)}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border:1px solid #27272a;border-radius:12px;margin-bottom:24px">
        <tr><td style="padding:16px 20px">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${features.map(([label, check]) => `
            <tr>
              <td style="color:#a1a1aa;font-size:14px;padding:7px 0">${label}</td>
              <td style="color:#C9A84C;font-weight:900;font-size:14px;text-align:right;padding:7px 0">${check}</td>
            </tr>`).join("")}
            <tr style="border-top:1px solid #27272a">
              <td style="color:#fff;font-weight:700;font-size:15px;padding:12px 0 0">${isEN ? "Total per month" : "Total por mês"}</td>
              <td style="color:#C9A84C;font-weight:900;font-size:20px;text-align:right;padding-top:12px">€127</td>
            </tr>
          </table>
        </td></tr>
      </table>
      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:15px 24px;border-radius:14px;text-decoration:none;text-align:center">
        ${isEN ? "Activate subscription →" : "Activar subscrição →"}
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">${isEN ? "Access the app" : "Aceder à app"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription cancellation email
// ─────────────────────────────────────────────────────────────────────────────
export async function sendSubscriptionCancelledEmail({
  to, clientName, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isEN = lang === "en";

  await sendEmail({
    from: FROM, to,
    subject: isEN ? `${firstName}, your KRAV access has been suspended` : `${firstName}, o teu acesso ao KRAV foi suspenso`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:24px;font-weight:900;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px">
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 14px">${isEN ? `Hi ${firstName},` : `Olá ${firstName},`}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        ${isEN
          ? "Your subscription has been cancelled and access to the app is suspended. Your full history is saved."
          : "A tua subscrição foi cancelada e o acesso à app está suspenso. O teu histórico fica guardado na íntegra."}
      </p>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 24px">
        ${isEN
          ? "If you want to resume coaching, simply reactivate your subscription below. You pick up exactly where you left off."
          : "Se quiseres retomar o coaching, basta reactivar a subscrição abaixo. Retomas exactamente onde paraste."}
      </p>
      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:15px 24px;border-radius:14px;text-decoration:none;text-align:center">
        ${isEN ? "Reactivate subscription →" : "Reactivar subscrição →"}
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:20px 0 0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">${isEN ? "Access the app" : "Aceder à app"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Renewal reminder email — sent 3 days before subscription renews
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRenewalReminderEmail({
  to, clientName, renewalDate, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; renewalDate: string; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isEN = lang === "en";

  await sendEmail({
    from: FROM, to,
    subject: isEN ? `${firstName}, your plan renews on ${renewalDate}` : `${firstName}, o teu plano renova a ${renewalDate}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:24px;font-weight:900;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px">
      <h1 style="color:#fff;font-size:20px;font-weight:900;margin:0 0 14px">${isEN ? `Hi ${firstName},` : `Olá ${firstName},`}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        ${isEN
          ? `Your KRAV Premium Coaching plan renews automatically on <strong style="color:#fff">${renewalDate}</strong>. Confirm your payment method is up to date so you don't lose access.`
          : `O teu plano KRAV Premium Coaching renova automaticamente a <strong style="color:#fff">${renewalDate}</strong>. Confirma que o teu método de pagamento está actualizado para não perderes o acesso.`}
      </p>
      <a href="${siteUrl}/client/profile"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:14px;border-radius:14px;text-decoration:none;text-align:center">
        ${isEN ? "Manage payment method →" : "Gerir método de pagamento →"}
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:20px 0 0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">${isEN ? "Access the app" : "Aceder à app"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly summary email — sent Sunday evenings
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWeeklySummaryEmail({
  to, clientName, weekStart, weekEnd, workouts, didCheckin, steps, didNutrition, score, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; weekStart: string; weekEnd: string;
  workouts: number; didCheckin: boolean; steps: number; didNutrition: boolean;
  score: number; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isGreat = score >= 30;
  const isEN = lang === "en";

  const locale = isEN ? "en-GB" : "pt-PT";
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" });

  const stats = isEN
    ? [
        { label: "Workouts completed", value: workouts > 0 ? `${workouts} ✅` : "0", ok: workouts > 0 },
        { label: "Weekly check-in",    value: didCheckin ? "Done ✅" : "Missing", ok: didCheckin },
        { label: "Total steps",        value: steps > 0 ? `${(steps/1000).toFixed(1)}k 👟` : "—", ok: steps >= 10000 },
        { label: "Nutrition logged",   value: didNutrition ? "Yes ✅" : "—", ok: didNutrition },
      ]
    : [
        { label: "Treinos concluídos", value: workouts > 0 ? `${workouts} ✅` : "0", ok: workouts > 0 },
        { label: "Check-in semanal",   value: didCheckin ? "Feito ✅" : "Em falta", ok: didCheckin },
        { label: "Passos totais",      value: steps > 0 ? `${(steps/1000).toFixed(1)}k 👟` : "—", ok: steps >= 10000 },
        { label: "Nutrição registada", value: didNutrition ? "Sim ✅" : "—", ok: didNutrition },
      ];

  const subject = isEN
    ? (isGreat ? `🔥 Amazing week, ${firstName}! Summary ${fmt(weekStart)}–${fmt(weekEnd)}` : `📊 Weekly summary — ${fmt(weekStart)}–${fmt(weekEnd)}`)
    : (isGreat ? `🔥 Semana incrível, ${firstName}! Resumo ${fmt(weekStart)}–${fmt(weekEnd)}` : `📊 Resumo da semana — ${fmt(weekStart)}–${fmt(weekEnd)}`);

  await sendEmail({
    from: FROM, to, subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:22px;font-weight:900;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
      <p style="color:#71717a;font-size:12px;margin:5px 0 0">${isEN ? "Weekly summary" : "Resumo semanal"} · ${fmt(weekStart)} – ${fmt(weekEnd)}</p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px;margin-bottom:16px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:8px">${isGreat ? "🔥" : "📊"}</div>
        <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0">
          ${isEN
            ? (isGreat ? `Amazing week, ${firstName}!` : `Weekly summary, ${firstName}`)
            : (isGreat ? `Semana incrível, ${firstName}!` : `Resumo da semana, ${firstName}`)}
        </h1>
        <p style="color:#71717a;font-size:13px;margin:8px 0 0">
          ${isEN ? "Score:" : "Pontuação:"} <strong style="color:#C9A84C">${score} pts</strong>
        </p>
      </div>
      <div style="background:#0a0a0c;border-radius:10px;height:8px;margin-bottom:24px;overflow:hidden">
        <div style="height:100%;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9A84C);width:${Math.min(100, score * 2)}%"></div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${stats.map(s => `
        <tr style="border-bottom:1px solid #1f1f23">
          <td style="padding:11px 0;color:#a1a1aa;font-size:14px">${s.label}</td>
          <td style="padding:11px 0;text-align:right;font-weight:700;font-size:14px;color:${s.ok ? "#4ade80" : "#71717a"}">${s.value}</td>
        </tr>`).join("")}
      </table>
    </div>
    <div style="text-align:center;margin-bottom:28px">
      <a href="${siteUrl}/client/progress"
         style="display:inline-block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:14px;padding:13px 28px;border-radius:14px;text-decoration:none">
        ${isEN ? "View my progress →" : "Ver o meu progresso →"}
      </a>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px">
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0">
        ${isEN
          ? (isGreat ? "Keep it up! Consistency is the key to lasting results. 💪" : "A weaker week happens — the important thing is to start again. Next week is a new opportunity! 💪")
          : (isGreat ? "Continua assim! Consistência é a chave para resultados duradouros. 💪" : "Uma semana mais fraca acontece — o importante é recomeçar. A próxima semana é uma nova oportunidade! 💪")}
      </p>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      © ${new Date().getFullYear()} KRAV Coaching ·
      <a href="${siteUrl}/client/dashboard" style="color:#52525b">${isEN ? "Access the app" : "Aceder à app"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Trial end email — sent on the day the trial expires (day 0)
// Two CTAs: subscribe + leave feedback
// ─────────────────────────────────────────────────────────────────────────────
export async function sendTrialEndEmail({
  to, clientName, siteUrl, lang = "pt",
}: {
  to: string; clientName: string; siteUrl: string; lang?: "pt" | "en";
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isEN = lang === "en";

  const subject = isEN
    ? `${firstName}, your KRAV trial has ended`
    : `${firstName}, o teu trial KRAV terminou hoje`;

  const benefits = isEN
    ? ["Personalised weekly training plans", "Weekly check-ins & progress analysis", "Direct chat with your coach", "Full workout history & records"]
    : ["Planos de treino semanais personalizados", "Check-ins semanais e análise de progresso", "Chat direto com o coach", "Histórico completo de treinos e recordes"];

  await sendEmail({
    from: FROM, to, subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
    </div>
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px;margin-bottom:16px">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:40px;margin-bottom:8px">⏰</div>
        <p style="color:#C9A84C;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">
          ${isEN ? "Trial ended" : "Trial encerrado"}
        </p>
        <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 12px">${isEN ? `${firstName}, your 7 days have ended` : `${firstName}, os teus 7 dias terminaram`}</h1>
        <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0">
          ${isEN
            ? "Your trial is over, but everything you logged is saved — workouts, check-ins, progress, records. They will be waiting if you subscribe."
            : "O teu trial terminou, mas tudo o que registaste fica guardado — treinos, check-ins, progresso, recordes. Está à tua espera se subscreveres."}
        </p>
      </div>
      <div style="background:#0a0a0c;border:1px solid #1f1f23;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        ${benefits.map((b) => `
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #18181b">
          <span style="color:#C9A84C;font-weight:900;font-size:13px;flex-shrink:0">✓</span>
          <span style="color:#a1a1aa;font-size:13px">${b}</span>
        </div>`).join("")}
        <div style="padding-top:14px;text-align:right">
          <span style="color:#fff;font-weight:900;font-size:22px">€127</span>
          <span style="color:#71717a;font-size:13px"> ${isEN ? "/month" : "/mês"}</span>
        </div>
      </div>
      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#A8893A);color:#000;font-weight:800;font-size:15px;padding:15px 24px;border-radius:14px;text-decoration:none;text-align:center;margin-bottom:10px">
        ${isEN ? "Continue my coaching →" : "Continuar o coaching →"}
      </a>
      <p style="color:#3f3f46;font-size:11px;text-align:center;margin:8px 0 0">
        ${isEN ? "No commitment · Cancel at any time" : "Sem permanência · Cancelas a qualquer momento"}
      </p>
    </div>
    <div style="background:#111113;border:1px solid #1f1f23;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px">
      <p style="color:#71717a;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px">
        ${isEN ? "Not subscribing for now?" : "Não vais subscrever por agora?"}
      </p>
      <p style="color:#fff;font-size:15px;font-weight:700;margin:0 0 10px">
        ${isEN ? "Leave your feedback — it means a lot 🙏" : "Deixa o teu feedback — significa muito 🙏"}
      </p>
      <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0 0 18px">
        ${isEN
          ? "2 minutes. Completely optional. Your opinion directly helps improve the coaching experience for future clients — and your testimonial may appear on the website."
          : "2 minutos. Completamente opcional. A tua opinião ajuda directamente a melhorar a experiência de coaching para futuros clientes — e o teu testemunho poderá aparecer no site."}
      </p>
      <a href="${siteUrl}/client/dashboard"
         style="display:inline-block;border:1px solid #3f3f46;color:#a1a1aa;font-weight:600;font-size:13px;padding:11px 24px;border-radius:12px;text-decoration:none">
        ${isEN ? "Leave feedback →" : "Deixar feedback →"}
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      KRAV Coaching · <a href="mailto:kravdoesntlift@gmail.com" style="color:#52525b">${isEN ? "Contact support" : "Contactar suporte"}</a>
    </p>
  </div>
</body>
</html>`,
  });
}
