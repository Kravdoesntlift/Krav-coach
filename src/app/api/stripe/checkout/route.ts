import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe não configurado. Adiciona STRIPE_SECRET_KEY ao .env.local" },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, priceAmount, currency, clientEmail, clientName } = body as {
      clientId: string;
      priceAmount: number;
      currency: string;
      clientEmail: string;
      clientName: string;
    };

    if (!clientId || !priceAmount || !currency) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });

    const admin = createAdminClient();

    // Get or create Stripe customer
    const { data: clientProfile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", clientId)
      .single();

    let stripeCustomerId: string;

    if (clientProfile?.stripe_customer_id) {
      stripeCustomerId = clientProfile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: clientEmail || undefined,
        name: clientName || undefined,
        metadata: { client_id: clientId, coach_id: user.id },
      });
      stripeCustomerId = customer.id;

      await admin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", clientId);
    }

    // Use request origin to ensure correct scheme + host in all environments
    const siteUrl = (() => {
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
      return req.nextUrl.origin;
    })();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "KRAV Premium Coaching" },
            unit_amount: priceAmount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        coach_id: user.id,
        client_id: clientId,
      },
      success_url: `${siteUrl}/coach/dashboard?payment=success`,
      cancel_url: `${siteUrl}/coach/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
