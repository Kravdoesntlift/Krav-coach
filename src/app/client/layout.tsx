import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { healStaleSubscriptions } from "@/lib/billing/sync";
import { logout } from "@/app/auth/actions";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";
import TrialFeedbackSection from "@/components/client/TrialFeedbackSection";
import { LangProvider } from "@/components/LangProvider";
import { ClientShell } from "@/components/client/ClientShell";
import { getLang } from "@/lib/i18n/getLang";
import TierChooser from "@/components/client/TierChooser";
import type { Lang } from "@/lib/training/base-plan";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/coach/dashboard");

  // Before this page can lock anyone out, make sure the billing state it is
  // about to judge them on is current. Locking a paying client behind a paywall
  // because a webhook was missed is the single worst outcome here, and until
  // now it could persist until the nightly job ran.
  const wouldBeBlocked =
    profile.status === "cancelled" ||
    (profile.trial_ends_at !== null && new Date(profile.trial_ends_at as string) <= new Date());

  if (wouldBeBlocked) {
    const healed = await healStaleSubscriptions({ clientId: user.id }).catch(() => 0);
    if (healed > 0) {
      const { data: fresh } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (fresh) profile = fresh;
    }
  }

  // ── Trial check ─────────────────────────────────────────────────────────
  let trialDaysLeft: number | null = null;
  let trialExpired = false;

  if (profile.trial_ends_at) {
    const now      = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    // Calendar-day difference: updates at midnight UTC, not every 24h
    const todayUTC = Date.UTC(now.getUTCFullYear(),      now.getUTCMonth(),      now.getUTCDate());
    const endUTC   = Date.UTC(trialEnd.getUTCFullYear(), trialEnd.getUTCMonth(), trialEnd.getUTCDate());
    trialDaysLeft  = Math.max(0, Math.round((endUTC - todayUTC) / 86_400_000));
    trialExpired   = trialDaysLeft <= 0;
  }

  if (trialExpired) {
    // A client can legitimately hold more than one subscription row (a resubscribe,
    // or a stale row for a subscription that no longer exists in Stripe), so this
    // must not use maybeSingle(): that errors on multiple rows and would paywall
    // a paying client. Take any live row.
    const { data: liveSubs } = await supabase
      .from("stripe_subscriptions")
      .select("status")
      .eq("client_id", user.id)
      .in("status", ["active", "trialing"])
      .limit(1);
    const activeSub = liveSubs?.[0] ?? null;

    // profiles.subscription_renews_at is maintained by the webhook and the nightly
    // reconciliation. Honour it as a second signal so a lagging or missing
    // subscription row can never lock out someone who has paid.
    const renewsAt = profile.subscription_renews_at
      ? new Date(profile.subscription_renews_at as string)
      : null;
    const hasFutureRenewal = renewsAt !== null && renewsAt.getTime() >= Date.now();

    if (!activeSub && !hasFutureRenewal) {
      const firstName = profile.full_name?.split(" ")[0] ?? "atleta";
      return (
        <Paywall
          firstName={firstName}
          reason="trial"
          lang={lang}
          logoutAction={logout}
          showFeedback
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
        lang={lang}
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
  lang,
  logoutAction,
  showFeedback = false,
}: {
  firstName: string;
  reason: "trial" | "cancelled";
  lang: Lang;
  logoutAction: () => Promise<void>;
  showFeedback?: boolean;
}) {
  const isEN = lang === "en";

  const title = reason === "trial"
    ? (isEN ? "Your trial is over," : "O teu trial terminou,")
    : (isEN ? "Your access is paused," : "O teu acesso foi suspenso,");

  const subtitle = reason === "trial"
    ? (isEN
        ? "Everything you logged is saved. Pick how you want to carry on."
        : "Todo o teu progresso está guardado. Escolhe como queres continuar.")
    : (isEN
        ? "Your subscription was cancelled. Pick a plan to get access back."
        : "A tua subscrição foi cancelada. Escolhe um plano para voltares a ter acesso.");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-[#C9A84C]">.</span>
        </h1>

        <div className="w-16 h-16 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 flex items-center justify-center mx-auto">
          <span className="text-3xl">🔒</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-2xl font-bold leading-tight">
            {title}<br />{firstName}.
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">{subtitle}</p>
        </div>

        <TierChooser lang={lang} />

        <a
          href="https://instagram.com/kravdoesntlift"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full border border-zinc-800 text-gray-500 text-sm font-medium py-3 rounded-xl hover:border-zinc-700 hover:text-white transition-colors"
        >
          {isEN ? "Talk to the coach on Instagram" : "Falar com o coach no Instagram"}
        </a>

        {showFeedback && reason === "trial" && <TrialFeedbackSection />}

        <div className="h-px bg-zinc-800" />
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-gray-600 hover:text-white transition-colors">
            {isEN ? "Log out" : "Terminar sessão"}
          </button>
        </form>
      </div>
    </div>
  );
}
