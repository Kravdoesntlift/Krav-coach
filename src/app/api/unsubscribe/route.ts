import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/unsubscribe?id=<lead_id>
 *
 * GDPR Art.º 21: one-click unsubscribe from drip emails.
 * Sets unsubscribed_at on the lead row; leads-drip cron skips these.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id || typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) {
    return new NextResponse(unsubPage("Pedido inválido.", false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id)
    .is("unsubscribed_at", null);

  if (error) {
    console.error("[unsubscribe]", error.message);
    return new NextResponse(unsubPage("Ocorreu um erro. Tenta novamente.", false), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }

  return new NextResponse(unsubPage("Cancelado com sucesso.", true), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
    status: 200,
  });
}

function unsubPage(message: string, success: boolean) {
  const color = success ? "#22c55e" : "#ef4444";
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>KRAV Coach, Subscrição</title>
</head>
<body style="margin:0;padding:40px 16px;background:#09090b;font-family:system-ui,sans-serif;color:#e4e4e7;text-align:center;">
  <p style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#C9A84C;margin:0 0 32px">KRAV.</p>
  <p style="font-size:16px;color:${color};margin:0 0 16px">${message}</p>
  ${success ? `<p style="font-size:13px;color:#71717a">Não receberás mais emails de coaching.<br>Podes sempre contactar-nos em <a href="mailto:andre@kravcoaching.com" style="color:#C9A84C">andre@kravcoaching.com</a>.</p>` : ""}
</body>
</html>`;
}
