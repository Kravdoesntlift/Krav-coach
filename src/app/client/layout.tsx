import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { logout } from "@/app/auth/actions";
import type { NavItem } from "@/components/Navbar";
import { DumbbellIcon, ChatIcon, ChartIcon, UserIcon, ForkKnifeIcon } from "@/components/ui/Icons";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";

async function subscribeAction() {
  "use server";
  if (!process.env.STRIPE_SECRET_KEY) return;
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
  const Stripe  = (await import("stripe")).default;
  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });

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
    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();
    const msLeft = trialEnd.getTime() - now.getTime();
    trialDaysLeft = Math.ceil(msLeft / 86_400_000);
    trialExpired = trialDaysLeft <= 0;
  }

  if (trialExpired) {
    // Check if they have an active subscription — if yes, let them through
    const { data: activeSub } = await supabase
      .from("stripe_subscriptions")
      .select("status")
      .eq("client_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!activeSub) {
      const firstName = profile.full_name?.split(" ")[0] ?? "atleta";
      return <Paywall firstName={firstName} reason="trial" subscribeAction={subscribeAction} logoutAction={logout} />;
    }
  }

  // Paused = coach suspended temporarily → simple info screen
  if (profile.status === "paused") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <h1 className="text-3xl font-black tracking-tight text-white">KRAV<span className="text-brand-gold">.</span></h1>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-500/30 bg-yellow-500/10">
            <span className="text-4xl">⏸</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">Conta temporariamente pausada</h2>
            <p className="text-gray-400 text-sm leading-relaxed">O acesso está suspenso temporariamente. Contacta o teu coach para reactivar.</p>
          </div>
          <div className="h-px bg-zinc-800" />
          <form action={logout}><button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">Terminar sessão</button></form>
        </div>
      </div>
    );
  }

  // Cancelled = subscription ended → same paywall as expired trial
  if (profile.status === "cancelled") {
    const firstName = profile.full_name?.split(" ")[0] ?? "atleta";
    return <Paywall firstName={firstName} reason="cancelled" subscribeAction={subscribeAction} logoutAction={logout} />;
  }

  // Unread messages count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .is("read_at", null);

  const unread = unreadCount ?? 0;

  // Desktop navbar — clean grouped structure
  const clientNav: NavItem[] = [
    { href: "/client/dashboard", label: "Treino" },
    { href: "/client/nutrition", label: "Nutrição" },
    { href: "/client/chat",      label: "Chat",  badge: unread },
    {
      label: "Progresso",
      children: [
        { href: "/client/progress",     label: "📈 Análise" },
        { href: "/client/checkin",      label: "📋 Check-in" },
        { href: "/client/daily-log",    label: "🔥 Registo Diário" },
        { href: "/client/history",      label: "📅 Histórico" },
        { href: "/client/records",      label: "🏆 PRs" },
        { href: "/client/achievements", label: "⭐ Conquistas" },
        { href: "/client/photos",       label: "📸 Fotos" },
        { href: "/client/report",       label: "📊 Relatório Mensal" },
        { href: "/client/weekly-report",label: "📄 Relatório Semanal" },
        { href: "/client/leaderboard",  label: "🥇 Leaderboard" },
      ],
    },
    {
      label: "Perfil",
      children: [
        { href: "/client/profile",      label: "👤 A minha conta" },
        { href: "/client/ai-coach",     label: "🤖 AI Coach" },
        { href: "/client/sessions",     label: "📅 Sessões" },
        { href: "/client/integrations", label: "⌚ Integrações" },
        { href: "/client/referral",     label: "👥 Referências" },
      ],
    },
  ];

  // Bottom nav — 5 clean items, no more drawer
  const clientBottomNav = [
    { href: "/client/dashboard", label: "Treino",   icon: <DumbbellIcon size={22} />, badge: 0 },
    { href: "/client/nutrition", label: "Nutrição", icon: <ForkKnifeIcon size={22} />, badge: 0 },
    { href: "/client/chat",      label: "Chat",     icon: <ChatIcon size={22} />,     badge: unread },
    { href: "/client/progress",  label: "Progresso",icon: <ChartIcon size={22} />,    badge: 0 },
    { href: "/client/profile",   label: "Perfil",   icon: <UserIcon size={22} />,     badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-black">
      <ServiceWorkerRegister />
      <GlobalBadgeSync userId={user.id} />
      <Navbar profile={profile} navItems={clientNav} />
      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-20 pb-24 md:pb-12">
        {trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 3 && (
          <div className="mb-4 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <p className="text-sm text-[#C9A84C] font-medium">
                O teu trial termina {trialDaysLeft === 1 ? "amanhã" : `em ${trialDaysLeft} dias`}.
              </p>
            </div>
            <a
              href="https://instagram.com/kravdoesntlift"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-bold text-black bg-[#C9A84C] rounded-lg px-3 py-1.5 hover:bg-[#A8893A] transition-colors"
            >
              Subscrever
            </a>
          </div>
        )}
        {children}
      </main>
      <BottomNav items={clientBottomNav} userId={user.id} />
      <PushPrompt />
    </div>
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
        {/* Logo */}
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-[#C9A84C]">.</span>
        </h1>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center mx-auto">
          <span className="text-4xl">🔒</span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-white text-2xl font-bold leading-tight">
            {reason === "trial"
              ? <>O teu trial terminou,<br />{firstName}.</>
              : <>O teu acesso foi suspenso,<br />{firstName}.</>}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {reason === "trial"
              ? "Todo o teu progresso está guardado. Activa a subscrição para continuar."
              : "A tua subscrição foi cancelada. Reactiva para voltar a ter acesso total."}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-zinc-900 rounded-2xl p-5 text-left space-y-3">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <span className="text-[#C9A84C] mt-0.5 shrink-0 font-bold">✓</span>
              <span className="text-gray-300 text-sm">{b}</span>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="space-y-3">
          <div>
            <span className="text-4xl font-black text-white">€127</span>
            <span className="text-gray-400 text-sm">/mês</span>
          </div>

          {/* Primary — Stripe checkout */}
          <form action={subscribeAction}>
            <button
              type="submit"
              className="w-full font-bold text-black py-4 rounded-xl transition-colors text-center"
              style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}
            >
              Subscrever agora →
            </button>
          </form>

          {/* Secondary — Instagram */}
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
