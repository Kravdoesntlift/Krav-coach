import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import SubscriptionManager from "@/components/client/SubscriptionManager";
import { logout } from "@/app/auth/actions";

const tools = [
  { href: "/client/ai-coach",     emoji: "🤖", label: "AI Coach",     sub: "Assistente inteligente" },
  { href: "/client/sessions",     emoji: "📅", label: "Sessões",      sub: "Próximas sessões" },
  { href: "/client/integrations", emoji: "⌚", label: "Integrações",  sub: "Apple Health · Strava" },
  { href: "/client/referral",     emoji: "👥", label: "Referências",  sub: "Convida amigos" },
];

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: subscription } = await supabase
    .from("stripe_subscriptions")
    .select("status, amount_cents, current_period_end")
    .eq("client_id", user!.id)
    .in("status", ["active", "past_due", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 text-sm mt-1">Conta & definições</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          {/* Logout icon — always visible at the top */}
          <form action={logout}>
            <button
              type="submit"
              title="Terminar sessão"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 gap-2">
        {tools.map(({ href, emoji, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <span className="text-2xl leading-none w-8 text-center flex-shrink-0">{emoji}</span>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">{label}</p>
              <p className="text-zinc-500 text-[11px] leading-tight mt-0.5 truncate">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <ProfileForm profile={profile} email={user!.email ?? ""} />

      <SubscriptionManager
        hasSubscription={!!subscription && !!profile?.stripe_customer_id}
        status={subscription?.status ?? null}
        renewsAt={subscription?.current_period_end ?? null}
        amountCents={subscription?.amount_cents ?? null}
      />

      {/* Logout — also at bottom for discoverability */}
      <form action={logout}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-zinc-800 hover:border-red-500/20 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Terminar sessão
        </button>
      </form>
    </div>
  );
}
