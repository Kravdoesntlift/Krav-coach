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
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { clientId } = (await req.json()) as { clientId: string };
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
      return NextResponse.json(
        { error: "Este cliente não tem um cliente Stripe associado." },
        { status: 404 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: clientProfile.stripe_customer_id,
      return_url: `${siteUrl}/coach/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
