import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { logout } from "@/app/auth/actions";
import type { NavItem } from "@/components/Navbar";
import { DumbbellIcon, ChatIcon, ChartIcon, UserIcon, ForkKnifeIcon } from "@/components/ui/Icons";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";

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
      // Fetch coach info for the paywall
      const { data: coachLink } = await supabase
        .from("coach_clients")
        .select("coach_id, profiles!coach_id(full_name, avatar_url)")
        .eq("client_id", user.id)
        .maybeSingle();
      const coachName = (coachLink?.profiles as { full_name?: string } | null)?.full_name ?? "Coach";
      const firstName = profile.full_name?.split(" ")[0] ?? "atleta";

      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm space-y-8 text-center">
            {/* Logo */}
            <h1 className="text-3xl font-black tracking-tight text-white">
              KRAV<span className="text-[#C9A84C]">.</span>
            </h1>

            {/* Lock icon */}
            <div className="w-20 h-20 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center mx-auto">
              <span className="text-4xl">🔒</span>
            </div>

            {/* Main message */}
            <div className="space-y-3">
              <h2 className="text-white text-2xl font-bold leading-tight">
                O teu trial terminou,<br />{firstName}.
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Esperamos que tenhas gostado da experiência. Para continuar com o teu {coachName} e manteres o progresso que fizeste, ativa a tua subscrição.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-zinc-900 rounded-2xl p-5 text-left space-y-3">
              {[
                "Planos de treino semanais personalizados",
                "Check-ins de evolução e análise de progresso",
                "Nutrição e macros adaptados ao teu objetivo",
                "Acesso direto ao teu coach via chat",
                "Histórico completo de treinos e medidas",
              ].map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <span className="text-[#C9A84C] mt-0.5 shrink-0">✓</span>
                  <span className="text-gray-300 text-sm">{b}</span>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-black text-white">€127</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
              <a
                href="https://instagram.com/kravdoesntlift"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#C9A84C] text-black font-bold py-4 rounded-xl hover:bg-[#A8893A] transition-colors text-center"
              >
                Quero continuar
              </a>
              <p className="text-gray-600 text-xs">
                Fala com o {coachName} no Instagram ou envia um email para ativar a tua conta.
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
  }

  // Block access if account is paused or cancelled
  if (profile.status && profile.status !== "active") {
    const isPaused = profile.status === "paused";
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <h1 className="text-3xl font-black tracking-tight text-white">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
            isPaused ? "border-yellow-500/30 bg-yellow-500/10" : "border-red-500/30 bg-red-500/10"
          }`}>
            <span className="text-4xl">{isPaused ? "⏸" : "✕"}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">
              {isPaused ? "Conta temporariamente pausada" : "Conta cancelada"}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isPaused
                ? "O acesso está temporariamente suspenso. Contacta o teu coach para reactivar."
                : "O teu plano foi cancelado. Contacta o teu coach para mais informações."}
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
