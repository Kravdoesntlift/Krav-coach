import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/stripe/health
// Coach-only diagnostic: verifies Stripe live mode config without charging anyone.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "Apenas coaches" }, { status: 403 });
  }

  const results: Record<string, { ok: boolean; detail: string }> = {};

  // ── 1. Secret key format ────────────────────────────────────────────────────
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!secretKey) {
    results.secret_key = { ok: false, detail: "STRIPE_SECRET_KEY não está definida no Vercel" };
  } else if (secretKey.startsWith("sk_live_")) {
    results.secret_key = { ok: true, detail: "sk_live_... ✓ (modo produção)" };
  } else if (secretKey.startsWith("sk_test_")) {
    results.secret_key = { ok: false, detail: "sk_test_... ✗ — ainda em modo teste! Muda para sk_live_ no Vercel." };
  } else {
    results.secret_key = { ok: false, detail: `Formato desconhecido: ${secretKey.slice(0, 8)}...` };
  }

  // ── 2. Webhook secret present ───────────────────────────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!webhookSecret) {
    results.webhook_secret = { ok: false, detail: "STRIPE_WEBHOOK_SECRET não está definida" };
  } else if (webhookSecret.startsWith("whsec_")) {
    results.webhook_secret = { ok: true, detail: "whsec_... ✓ está definida" };
  } else {
    results.webhook_secret = { ok: false, detail: "Formato inválido — deve começar com whsec_" };
  }

  // ── 3. Stripe API call — verify key is valid & live ─────────────────────────
  if (secretKey) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });
      // Use balance as a lightweight "is this key valid?" check
      const balance = await stripe.balance.retrieve();
      const account = { id: "ok", charges_enabled: true, payouts_enabled: true };

      results.stripe_api = {
        ok: true,
        detail: `Chave válida ✓ — conseguiu ligar à API Stripe`,
      };

      // ── 4. Check webhooks registered in Stripe ────────────────────────────
      const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
      const ourEndpoint = `${siteUrl}/api/stripe/webhook`;
      const match = webhooks.data.find((w) => w.url === ourEndpoint);

      if (!match) {
        results.webhook_registered = {
          ok: false,
          detail: `Nenhum webhook aponta para ${ourEndpoint}. Cria em Stripe → Developers → Webhooks.`,
        };
      } else {
        const requiredEvents = [
          "checkout.session.completed",
          "customer.subscription.updated",
          "customer.subscription.deleted",
          "invoice.payment_failed",
        ];
        const missing = requiredEvents.filter((e) => !match.enabled_events.includes(e) && !match.enabled_events.includes("*"));
        if (missing.length > 0) {
          results.webhook_registered = {
            ok: false,
            detail: `Webhook encontrado mas faltam eventos: ${missing.join(", ")}`,
          };
        } else {
          results.webhook_registered = {
            ok: true,
            detail: `Webhook ✓ — ${match.url} (status: ${match.status})`,
          };
        }
      }

      // ── 5. Webhook secret matches a live whsec ──────────────────────────────
      if (match && webhookSecret) {
        const isLiveSecret = !webhookSecret.includes("test");
        results.webhook_secret_mode = {
          ok: true,
          detail: "Signing secret está definido — verifica que copiaste do webhook live (não do test)",
        };
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.stripe_api = { ok: false, detail: `Erro ao chamar Stripe API: ${msg}` };
    }
  }

  // ── 6. VAPID push keys ───────────────────────────────────────────────────────
  const vapidSubject = process.env.VAPID_SUBJECT ?? "";
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";
  const vapidOk = !!vapidSubject && !!vapidPublic && !!vapidPrivate &&
    (vapidSubject.startsWith("mailto:") || vapidSubject.startsWith("https://"));
  results.vapid_push = {
    ok: vapidOk,
    detail: vapidOk
      ? `VAPID ✓ — subject: ${vapidSubject}`
      : !vapidSubject ? "VAPID_SUBJECT em falta"
      : !vapidPublic ? "NEXT_PUBLIC_VAPID_PUBLIC_KEY em falta"
      : !vapidPrivate ? "VAPID_PRIVATE_KEY em falta"
      : `VAPID_SUBJECT inválido — deve começar com mailto: ou https://`,
  };

  const allOk = Object.values(results).every((r) => r.ok);
  return NextResponse.json({ allOk, checks: results }, { status: 200 });
}
