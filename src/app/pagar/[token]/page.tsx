import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIdFromPayToken } from "@/lib/billing/pay-link";

/**
 * The page behind a payment link the coach sends by message.
 *
 * It builds the Stripe session when it is opened, not when the link is made.
 * A Checkout URL pasted into a chat is a session that starts ageing from that
 * moment and dies within the day; this one is always fresh, however long the
 * message sat unread.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pagamento · KRAV Coach",
  robots: { index: false, follow: false },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kravcoaching.com";

function Card({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ background: "#080808" }}>
      <div className="w-full max-w-sm text-center space-y-6">
        <span className="text-2xl font-black tracking-tighter text-white">
          KRAV<span style={{ color: "#C9A84C" }}>.</span>
        </span>
        <div
          className="rounded-3xl p-7 space-y-3"
          style={{ background: "#0f0f0f", border: "1px solid rgba(201,168,76,0.16)" }}
        >
          <h1 className="text-white text-lg font-black tracking-tight">{title}</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">{body}</p>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-black text-black"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const clientId = clientIdFromPayToken(token);

  if (!clientId) {
    return (
      <Card
        title="Link inválido"
        body="Este link de pagamento não é válido. Pede um novo ao teu coach."
        cta={{ href: "/", label: "Ir para o site" }}
      />
    );
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: liveSubs }, { data: link }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, stripe_customer_id, status").eq("id", clientId).maybeSingle(),
    admin.from("stripe_subscriptions").select("status").eq("client_id", clientId).in("status", ["active", "trialing"]).limit(1),
    admin.from("coach_clients").select("coach_id").eq("client_id", clientId).eq("assigned_role", "coach").maybeSingle(),
  ]);

  if (!profile || profile.role !== "client") {
    return (
      <Card
        title="Link inválido"
        body="Não encontrámos esta conta. Pede um novo link ao teu coach."
        cta={{ href: "/", label: "Ir para o site" }}
      />
    );
  }

  // Paying twice is the one outcome nobody recovers from gracefully.
  if (liveSubs && liveSubs.length > 0) {
    return (
      <Card
        title="Já tens subscrição ativa"
        body="Não é preciso pagar outra vez. Entra na app e continua o teu plano."
        cta={{ href: "/client/dashboard", label: "Entrar na app" }}
      />
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return (
      <Card
        title="Pagamentos indisponíveis"
        body="Não foi possível abrir o pagamento agora. Fala com o teu coach."
        cta={{ href: "/", label: "Ir para o site" }}
      />
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
  });

  const coachId = link?.coach_id ?? "";
  let customerId = profile.stripe_customer_id ?? "";

  if (!customerId) {
    const { data: authUser } = await admin.auth.admin.getUserById(clientId);
    const customer = await stripe.customers.create({
      email: authUser?.user?.email ?? undefined,
      name: profile.full_name ?? "",
      metadata: { client_id: clientId, coach_id: coachId },
    });
    customerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", clientId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: { name: "KRAV Premium Coaching" },
        unit_amount: 12700,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    metadata: { coach_id: coachId, client_id: clientId },
    // Landing here activates the account on the spot instead of waiting for
    // the webhook, and the webhook still covers the case where they close the
    // tab on the way back.
    success_url: `${SITE}/client/pending?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE}/`,
  });

  if (!session.url) {
    return (
      <Card
        title="Não foi possível abrir o pagamento"
        body="Tenta outra vez dentro de instantes, ou fala com o teu coach."
        cta={{ href: "/", label: "Ir para o site" }}
      />
    );
  }

  redirect(session.url);
}
