import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import SubscriptionManager from "@/components/client/SubscriptionManager";

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
        <PushNotificationToggle />
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
    </div>
  );
}
