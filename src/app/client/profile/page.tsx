import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import SubscriptionManager from "@/components/client/SubscriptionManager";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Fetch active subscription
  const { data: subscription } = await supabase
    .from("stripe_subscriptions")
    .select("status, amount_cents, current_period_end")
    .eq("client_id", user!.id)
    .in("status", ["active", "past_due", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="page-enter space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 text-sm mt-1">Gere as tuas informações</p>
        </div>
        <PushNotificationToggle />
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
