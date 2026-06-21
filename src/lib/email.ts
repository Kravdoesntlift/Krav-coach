import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "André · KRAV Coaching <andre@kravcoaching.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInvoiceEmail({
  to,
  clientName,
  amountEur,
  periodEnd,
  invoiceNumber,
}: {
  to: string;
  clientName: string;
  amountEur: string;
  periodEnd: string;
  invoiceNumber: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#C9A84C;margin:0">KRAV.</p>
      <p style="color:#71717a;font-size:13px;margin:6px 0 0">Premium Coaching</p>
    </div>

    <!-- Card -->
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px">
      <p style="color:#71717a;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">Recibo de Pagamento</p>
      <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 24px">Olá, ${clientName}!</h1>

      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">
        O teu pagamento foi processado com sucesso. Aqui está o teu recibo.
      </p>

      <!-- Invoice details -->
      <div style="background:#0a0a0c;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#71717a;font-size:13px;padding:6px 0">Referência</td>
            <td style="color:#e4e4e7;font-size:13px;text-align:right;font-family:monospace">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:6px 0">Serviço</td>
            <td style="color:#e4e4e7;font-size:13px;text-align:right">KRAV Premium Coaching</td>
          </tr>
          <tr>
            <td style="color:#71717a;font-size:13px;padding:6px 0">Próxima renovação</td>
            <td style="color:#e4e4e7;font-size:13px;text-align:right">${periodEnd}</td>
          </tr>
          <tr style="border-top:1px solid #27272a">
            <td style="color:#fff;font-size:16px;font-weight:700;padding:12px 0 0">Total pago</td>
            <td style="color:#C9A84C;font-size:20px;font-weight:900;text-align:right;padding-top:12px">${amountEur}</td>
          </tr>
        </table>
      </div>

      <p style="color:#52525b;font-size:12px;line-height:1.6;margin:0">
        Podes aceder à tua área de cliente em <a href="https://kravcoaching.com/client/dashboard" style="color:#C9A84C">kravcoaching.com</a>.
        Para questões de faturação, contacta <a href="mailto:kravdoesntlift@gmail.com" style="color:#C9A84C">kravdoesntlift@gmail.com</a>.
      </p>
    </div>

    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:24px 0">
      © ${new Date().getFullYear()} KRAV Coaching · kravcoaching.com
    </p>
  </div>
</body>
</html>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Recibo KRAV Coaching — ${amountEur}`,
    html,
  });
}

export async function sendPaymentFailedEmail({
  to,
  clientName,
  amountEur,
}: {
  to: string;
  clientName: string;
  amountEur: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Problema com o teu pagamento KRAV",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:22px;font-weight:900;color:#C9A84C;margin:0">KRAV.</p>
    </div>
    <div style="background:#111113;border:1px solid #3f3f46;border-radius:20px;padding:32px">
      <p style="color:#f87171;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">Pagamento falhado</p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 16px">Olá, ${clientName}</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">
        Não foi possível processar o teu pagamento de <strong style="color:#fff">${amountEur}</strong>.
        Por favor atualiza os teus dados de pagamento para manter o acesso ao coaching.
      </p>
      <a href="https://kravcoaching.com/client/dashboard" style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none">
        Atualizar método de pagamento
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
  to,
  clientName,
  coachName,
  siteUrl,
}: {
  to: string;
  clientName: string;
  coachName: string;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const coachFirst = coachName.split(" ")[0] || "Coach";

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Bem-vindo(a) ao KRAV, ${firstName}! 🏆`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px">
      <p style="font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#fff;margin:0">
        KRAV<span style="color:#C9A84C">.</span>
      </p>
      <p style="color:#71717a;font-size:13px;margin:6px 0 0">Premium Coaching</p>
    </div>

    <!-- Hero card -->
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:36px;margin-bottom:20px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#E8C96B,#A8893A);border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:28px">🏆</div>
      </div>
      <h1 style="color:#fff;font-size:26px;font-weight:900;text-align:center;margin:0 0 12px">
        Bem-vindo(a), ${firstName}!
      </h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;text-align:center;margin:0 0 28px">
        A tua conta foi criada com sucesso. O teu coach <strong style="color:#fff">${coachFirst}</strong> irá preparar o teu plano personalizado nas próximas 24 horas úteis.
      </p>

      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:14px 24px;border-radius:14px;text-decoration:none;text-align:center">
        Aceder à minha área →
      </a>
    </div>

    <!-- Next steps -->
    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:28px;margin-bottom:20px">
      <p style="color:#71717a;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px">Os próximos passos</p>

      ${[
        ["1", "Completa o teu perfil", "Preenche os teus dados (peso, altura, objectivos) para que o coach possa criar o plano perfeito."],
        ["2", "Aguarda o teu plano", "Nas próximas 24 horas o coach cria e disponibiliza o teu plano de treino personalizado."],
        ["3", "Instala a app", "Abre o site no telemóvel e adiciona ao ecrã de início para uma experiência nativa."],
      ].map(([n, title, desc]) => `
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

    <!-- Install hint -->
    <div style="background:#0e1a0e;border:1px solid #1a3a1a;border-radius:14px;padding:16px 20px;margin-bottom:24px">
      <p style="color:#4ade80;font-size:13px;margin:0">
        💡 <strong>Instalar no telemóvel:</strong> Abre <a href="${siteUrl}" style="color:#4ade80">${siteUrl.replace("https://","")}</a> no Safari/Chrome e usa "Adicionar ao ecrã de início".
      </p>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      Enviado por ${coachFirst} · KRAV Coaching<br>
      <a href="${siteUrl}/client/dashboard" style="color:#52525b">Aceder à app</a> ·
      <a href="mailto:${process.env.RESEND_FROM?.match(/<(.+)>/)?.[1] ?? "kravdoesntlift@gmail.com"}" style="color:#52525b">Contactar suporte</a>
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
  to,
  clientName,
  daysLeft,
  siteUrl,
}: {
  to: string;
  clientName: string;
  daysLeft: number;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isLast = daysLeft === 1;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: isLast
      ? `${firstName}, o teu trial termina amanhã`
      : `${firstName}, faltam ${daysLeft} dias do teu trial`,
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
        ${isLast ? "Último dia de trial" : `${daysLeft} dias restantes`}
      </p>
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 16px">Olá ${firstName},</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        ${isLast
          ? `O teu trial termina amanhã. Tudo o que registaste fica guardado. Se quiseres continuar a ter acesso ao teu plano de treino, às mensagens do coach e ao histórico de progresso, activa a subscrição agora.`
          : `O teu trial termina em ${daysLeft} dias. Até agora já tens acesso ao teu plano de treino, ao coach e a todo o registo de progresso. Não percas esse acesso.`}
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border:1px solid #27272a;border-radius:12px;margin-bottom:24px">
        <tr><td style="padding:16px 20px">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["Planos de treino semanais personalizados", "✓"],
              ["Check-ins de evolução e progresso", "✓"],
              ["Nutrição e macros adaptados", "✓"],
              ["Acesso direto ao coach via chat", "✓"],
            ].map(([label, check]) => `
            <tr>
              <td style="color:#a1a1aa;font-size:14px;padding:7px 0">${label}</td>
              <td style="color:#C9A84C;font-weight:900;font-size:14px;text-align:right;padding:7px 0">${check}</td>
            </tr>`).join("")}
            <tr style="border-top:1px solid #27272a">
              <td style="color:#fff;font-weight:700;font-size:15px;padding:12px 0 0">Total por mês</td>
              <td style="color:#C9A84C;font-weight:900;font-size:20px;text-align:right;padding-top:12px">€127</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:15px 24px;border-radius:14px;text-decoration:none;text-align:center">
        Activar subscrição →
      </a>
    </div>

    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">Aceder à app</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription cancellation email — sent when subscription is cancelled
// ─────────────────────────────────────────────────────────────────────────────
export async function sendSubscriptionCancelledEmail({
  to,
  clientName,
  siteUrl,
}: {
  to: string;
  clientName: string;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${firstName}, o teu acesso ao KRAV foi suspenso`,
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
      <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 14px">Olá ${firstName},</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        A tua subscrição foi cancelada e o acesso à app está suspenso. O teu histórico fica guardado na íntegra.
      </p>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 24px">
        Se quiseres retomar o coaching, basta reactivar a subscrição abaixo. Retomas exactamente onde paraste.
      </p>
      <a href="${siteUrl}/client/dashboard"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:15px 24px;border-radius:14px;text-decoration:none;text-align:center">
        Reactivar subscrição →
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:20px 0 0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">Aceder à app</a>
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
  to,
  clientName,
  renewalDate,
  siteUrl,
}: {
  to: string;
  clientName: string;
  renewalDate: string;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${firstName}, o teu plano renova a ${renewalDate}`,
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
      <h1 style="color:#fff;font-size:20px;font-weight:900;margin:0 0 14px">Olá ${firstName},</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.7;margin:0 0 20px">
        O teu plano KRAV Premium Coaching renova automaticamente a <strong style="color:#fff">${renewalDate}</strong>.
        Confirma que o teu método de pagamento está actualizado para não perderes o acesso.
      </p>
      <a href="${siteUrl}/client/profile"
         style="display:block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:15px;padding:14px;border-radius:14px;text-decoration:none;text-align:center">
        Gerir método de pagamento →
      </a>
    </div>
    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:20px 0 0">
      KRAV Coaching · <a href="${siteUrl}/client/dashboard" style="color:#52525b">Aceder à app</a>
    </p>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly summary email — sent Sunday evenings alongside push notification
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWeeklySummaryEmail({
  to,
  clientName,
  weekStart,
  weekEnd,
  workouts,
  didCheckin,
  steps,
  didNutrition,
  score,
  siteUrl,
}: {
  to: string;
  clientName: string;
  weekStart: string;
  weekEnd: string;
  workouts: number;
  didCheckin: boolean;
  steps: number;
  didNutrition: boolean;
  score: number;
  siteUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const firstName = clientName.split(" ")[0];
  const isGreat = score >= 30;

  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" });

  const stats = [
    { label: "Treinos concluídos", value: workouts > 0 ? `${workouts} ✅` : "0", ok: workouts > 0 },
    { label: "Check-in semanal",   value: didCheckin ? "Feito ✅" : "Em falta", ok: didCheckin },
    { label: "Passos totais",      value: steps > 0 ? `${(steps/1000).toFixed(1)}k 👟` : "—", ok: steps >= 10000 },
    { label: "Nutrição registada", value: didNutrition ? "Sim ✅" : "—", ok: didNutrition },
  ];

  await getResend().emails.send({
    from: FROM,
    to,
    subject: isGreat
      ? `🔥 Semana incrível, ${firstName}! Resumo ${fmt(weekStart)}–${fmt(weekEnd)}`
      : `📊 Resumo da semana — ${fmt(weekStart)}–${fmt(weekEnd)}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:system-ui,-apple-system,sans-serif;color:#e4e4e7">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:22px;font-weight:900;color:#fff;margin:0">KRAV<span style="color:#C9A84C">.</span></p>
      <p style="color:#71717a;font-size:12px;margin:5px 0 0">Resumo semanal · ${fmt(weekStart)} – ${fmt(weekEnd)}</p>
    </div>

    <div style="background:#111113;border:1px solid #27272a;border-radius:20px;padding:32px;margin-bottom:16px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:8px">${isGreat ? "🔥" : "📊"}</div>
        <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0">
          ${isGreat ? `Semana incrível, ${firstName}!` : `Resumo da semana, ${firstName}`}
        </h1>
        <p style="color:#71717a;font-size:13px;margin:8px 0 0">
          Pontuação: <strong style="color:#C9A84C">${score} pts</strong>
        </p>
      </div>

      <!-- Score bar -->
      <div style="background:#0a0a0c;border-radius:10px;height:8px;margin-bottom:24px;overflow:hidden">
        <div style="height:100%;border-radius:10px;background:linear-gradient(90deg,#E8C96B,#C9A84C);width:${Math.min(100, score * 2)}%"></div>
      </div>

      <!-- Stats grid -->
      <table style="width:100%;border-collapse:collapse">
        ${stats.map(s => `
        <tr style="border-bottom:1px solid #1f1f23">
          <td style="padding:11px 0;color:#a1a1aa;font-size:14px">${s.label}</td>
          <td style="padding:11px 0;text-align:right;font-weight:700;font-size:14px;color:${s.ok ? "#4ade80" : "#71717a"}">${s.value}</td>
        </tr>`).join("")}
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:28px">
      <a href="${siteUrl}/client/progress"
         style="display:inline-block;background:linear-gradient(135deg,#E8C96B,#C9A84C);color:#000;font-weight:800;font-size:14px;padding:13px 28px;border-radius:14px;text-decoration:none">
        Ver o meu progresso →
      </a>
    </div>

    <!-- Motivational note -->
    <div style="background:#111113;border:1px solid #27272a;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px">
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0">
        ${isGreat
          ? "Continua assim! Consistência é a chave para resultados duradouros. 💪"
          : "Uma semana mais fraca acontece — o importante é recomeçar. A próxima semana é uma nova oportunidade! 💪"}
      </p>
    </div>

    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:0">
      © ${new Date().getFullYear()} KRAV Coaching ·
      <a href="${siteUrl}/client/dashboard" style="color:#52525b">Aceder à app</a>
    </p>
  </div>
</body>
</html>`,
  });
}
