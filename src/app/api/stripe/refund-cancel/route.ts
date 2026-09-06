import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const runtime = "nodejs";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
  }

  // 1. Auth: must be a coach
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "coach") {
    return NextResponse.json({ error: "Apenas coaches podem executar esta ação." }, { status: 403 });
  }

  // 2. Validate body
  const body = await req.json() as { clientId?: string };
  const { clientId } = body;
  if (!clientId) return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });

  // 3. Verify this coach manages this client
  const { data: rel } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!rel) {
    return NextResponse.json({ error: "Sem acesso a este cliente." }, { status: 403 });
  }

  const admin = createAdminClient();

  // 4. Find active subscription for this client
  const { data: sub } = await admin
    .from("stripe_subscriptions")
    .select("id, status, amount_cents")
    .eq("client_id", clientId)
    .in("status", ["active", "trialing", "past_due"])
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    // No Stripe subscription: just cancel in DB (free/manual client)
    await admin.from("profiles").update({ status: "cancelled" }).eq("id", clientId);
    return NextResponse.json({ cancelled: true, refunded: false, message: "Conta cancelada (sem subscrição Stripe ativa)." });
  }

  const stripe = getStripe();
  let refundAmount: number | null = null;
  let refundError: string | null = null;

  // 5. Cancel the subscription immediately in Stripe
  try {
    await stripe.subscriptions.cancel(sub.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao cancelar subscrição: ${msg}` }, { status: 500 });
  }

  // 6. Find the most recent successful charge for this client and refund it
  try {
    const { data: clientProfile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", clientId)
      .single();

    if (clientProfile?.stripe_customer_id) {
      const charges = await stripe.charges.list({
        customer: clientProfile.stripe_customer_id,
        limit: 5,
      });

      // Find most recent paid, non-refunded charge
      const charge = charges.data.find((c) => c.paid && !c.refunded && c.amount_refunded === 0);
      if (charge) {
        const refund = await stripe.refunds.create({
          charge: charge.id,
          reason: "requested_by_customer",
        });
        refundAmount = refund.amount;
      }
    }
  } catch (err) {
    // Refund failed (e.g. already refunded): subscription is still cancelled
    refundError = err instanceof Error ? err.message : "Erro no reembolso";
  }

  // 7. Update DB: profile status + subscription status
  await Promise.all([
    admin.from("profiles").update({ status: "cancelled" }).eq("id", clientId),
    admin.from("stripe_subscriptions").update({ status: "cancelled" }).eq("id", sub.id),
  ]);

  const amountEur = refundAmount != null
    ? `€ ${(refundAmount / 100).toFixed(2).replace(".", ",")}`
    : null;

  return NextResponse.json({
    cancelled: true,
    refunded: refundAmount != null,
    refundAmount: amountEur,
    refundError,
    message: refundAmount != null
      ? `Subscrição cancelada e reembolso de ${amountEur} iniciado (5–10 dias úteis).`
      : `Subscrição cancelada. ${refundError ? `Reembolso falhou: ${refundError}` : "Sem pagamento encontrado para reembolsar."}`,
  });
}
