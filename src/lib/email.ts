import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "KRAV Coaching <noreply@kravcoaching.com>";

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
        Para questões de faturação, contacta <a href="mailto:admin@kravcoach.com" style="color:#C9A84C">admin@kravcoach.com</a>.
      </p>
    </div>

    <p style="text-align:center;color:#3f3f46;font-size:11px;margin:24px 0">
      © ${new Date().getFullYear()} KRAV Coaching · kravcoaching.com
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
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

  await resend.emails.send({
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
