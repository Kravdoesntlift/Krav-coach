import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/auth/actions";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";
import { PaywallSubscribeButton } from "@/components/client/PaywallSubscribeButton";
import { LangProvider } from "@/components/LangProvider";
import { ClientShell } from "@/components/client/ClientShell";

async function subscribeAction() {
  "use server";
  // No Stripe key → fall back to Instagram contact
  if (!process.env.STRIPE_SECRET_KEY) {
    redirect("https://instagram.com/kravdoesntlift");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: coachLink }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("stripe_customer_id, full_name").eq("id", user.id).single(),
    admin.from("coach_clients").select("coach_id").eq("client_id", user.id).maybeSingle(),
    admin.auth.admin.getUserById(user.id),
  ]);

  const coachId = coachLink?.coach_id ?? "";
  const email   = authUser?.user?.email ?? "";

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
  });

  let stripeCustomerId = profile?.stripe_customer_id ?? "";
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: profile?.full_name ?? "",
      metadata: { client_id: user.id, coach_id: coachId },
    });
    stripeCustomerId = customer.id;
    await admin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
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
    metadata: { coach_id: coachId, client_id: user.id },
    success_url: `${siteUrl}/client/dashboard`,
    cancel_url:  `${siteUrl}/client/dashboard`,
  });

  redirect(session.url!);
}

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/coach/dashboard");

  // ── Trial check ─────────────────────────────────────────────────────────
  let trialDaysLeft: number | null = null;
  let trialExpired = false;

  if (profile.trial_ends_at) {
    const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.ceil(msLeft / 86_400_000);
    trialExpired  = trialDaysLeft <= 0;
  }

  if (trialExpired) {
    const { data: activeSub } = await supabase
      .from("stripe_subscriptions")
      .select("status")
      .eq("client_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!activeSub) {
      const firstName = profile.full_name?.split(" ")[0] ?? "atleta";
      return (
        <Paywall
          firstName={firstName}
          reason="trial"
          subscribeAction={subscribeAction}
          logoutAction={logout}
        />
      );
    }
  }

  // Paused = coach suspended temporarily → simple info screen
  if (profile.status === "paused") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <h1 className="text-3xl font-black tracking-tight text-white">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500/30 bg-yellow-500/10">
            <span className="text-4xl">⏸</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">Conta temporariamente pausada</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              O acesso está suspenso temporariamente. Contacta o teu coach para reactivar.
            </p>
          </div>
          <div className="h-px bg-zinc-800" />
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
              Terminar sessão
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Cancelled = subscription ended → Stripe paywall
  if (profile.status === "cancelled") {
    const firstName = profile.full_name?.split(" ")[0] ?? "atleta";
    return (
      <Paywall
        firstName={firstName}
        reason="cancelled"
        subscribeAction={subscribeAction}
        logoutAction={logout}
      />
    );
  }

  // Unread messages count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .is("read_at", null);

  const unread = unreadCount ?? 0;

  return (
    <LangProvider>
      <div className="min-h-screen bg-black">
        <ServiceWorkerRegister />
        <GlobalBadgeSync userId={user.id} />
        <ClientShell
          profile={profile}
          unread={unread}
          trialDaysLeft={trialDaysLeft}
          subscribeAction={subscribeAction}
          userId={user.id}
        >
          {children}
        </ClientShell>
        <PushPrompt />
      </div>
    </LangProvider>
  );
}

// ── Unified paywall (trial expired + subscription cancelled) ─────────────────
function Paywall({
  firstName,
  reason,
  subscribeAction,
  logoutAction,
}: {
  firstName: string;
  reason: "trial" | "cancelled";
  subscribeAction: () => Promise<void>;
  logoutAction: () => Promise<void>;
}) {
  const benefits = [
    "Planos de treino semanais personalizados",
    "Check-ins de evolução e análise de progresso",
    "Nutrição e macros adaptados ao teu objetivo",
    "Acesso direto ao coach via chat",
    "Histórico completo de treinos e medidas",
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-[#C9A84C]">.</span>
        </h1>

        <div className="w-20 h-20 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center mx-auto">
          <span className="text-4xl">🔒</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-2xl font-bold leading-tight">
            {reason === "trial"
              ? <>{`O teu trial terminou,`}<br />{firstName}.</>
              : <>{`O teu acesso foi suspenso,`}<br />{firstName}.</>}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {reason === "trial"
              ? "Todo o teu progresso está guardado. Activa a subscrição para continuar."
              : "A tua subscrição foi cancelada. Reactiva para voltar a ter acesso total."}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 text-left space-y-3">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <span className="text-[#C9A84C] mt-0.5 shrink-0 font-bold">✓</span>
              <span className="text-gray-300 text-sm">{b}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-4xl font-black text-white">€127</span>
            <span className="text-gray-400 text-sm">/mês</span>
          </div>

          <form action={subscribeAction}>
            <PaywallSubscribeButton />
          </form>

          <a
            href="https://instagram.com/kravdoesntlift"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-zinc-700 text-gray-400 text-sm font-medium py-3 rounded-xl hover:border-zinc-600 hover:text-white transition-colors"
          >
            Falar com o coach no Instagram
          </a>
        </div>

        <div className="h-px bg-zinc-800" />
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-600 hover:text-white transition-colors">
            Terminar sessão
          </button>
        </form>
      </div>
    </div>
  );
}

