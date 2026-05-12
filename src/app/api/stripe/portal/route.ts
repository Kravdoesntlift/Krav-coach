import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe não configurado." },
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
      .select("role, stripe_customer_id")
      .eq("id", user.id)
      .single();

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });

    const siteUrl = (() => {
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
      return req.nextUrl.origin;
    })();

    let stripeCustomerId: string;
    let returnUrl: string;

    if (profile?.role === "client") {
      // Client managing their own subscription
      if (!profile.stripe_customer_id) {
        return NextResponse.json({ error: "Sem subscrição ativa." }, { status: 404 });
      }
      stripeCustomerId = profile.stripe_customer_id;
      returnUrl = `${siteUrl}/client/profile`;
    } else if (profile?.role === "coach") {
      // Coach managing a client's subscription
      const body = await req.json() as { clientId?: string };
      const { clientId } = body;
      if (!clientId) {
        return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
      }
      const admin = createAdminClient();
      const { data: clientProfile } = await admin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", clientId)
        .single();
      if (!clientProfile?.stripe_customer_id) {
        return NextResponse.json({ error: "Este cliente não tem um cliente Stripe associado." }, { status: 404 });
      }
      stripeCustomerId = clientProfile.stripe_customer_id;
      returnUrl = `${siteUrl}/coach/billing`;
    } else {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
