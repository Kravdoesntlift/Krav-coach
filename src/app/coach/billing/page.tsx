import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") redirect("/client/dashboard");

  const admin = createAdminClient();

  // Fetch all clients via coach_clients table (or plans as fallback)
  const { data: assignments } = await admin
    .from("coach_clients")
    .select("client_id")
    .eq("coach_id", user.id);

  const { data: planClients } = await admin
    .from("workout_plans")
    .select("client_id")
    .eq("coach_id", user.id);

  const allClientIds = [
    ...new Set([
      ...(assignments ?? []).map((a) => a.client_id),
      ...(planClients ?? []).map((p) => p.client_id),
    ]),
  ];

  // Fetch profiles for all clients
  const { data: clientProfiles } = allClientIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, status, stripe_customer_id")
        .in("id", allClientIds)
    : { data: [] };

  // Fetch auth user emails
  const { data: authData } = await admin.auth.admin.listUsers();
  const emailMap = new Map<string, string>();
  for (const u of authData?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  // Fetch subscriptions
  type SubRow = { client_id: string; status: string; amount_cents: number | null; current_period_end: string | null };
  const { data: subscriptions } = allClientIds.length > 0
    ? await admin
        .from("stripe_subscriptions")
        .select("client_id, status, amount_cents, current_period_end")
        .in("client_id", allClientIds)
    : { data: [] as SubRow[] };

  const subMap = new Map<string, SubRow>();
  for (const sub of subscriptions ?? []) {
    subMap.set(sub.client_id, sub as SubRow);
  }

  const clients = (clientProfiles ?? []).map((cp) => ({
    id: cp.id,
    full_name: cp.full_name ?? "—",
    email: emailMap.get(cp.id) ?? "",
    status: cp.status ?? "",
    stripe_customer_id: cp.stripe_customer_id ?? null,
    subscription: subMap.get(cp.id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/coach/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-300">Pagamentos</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Pagamentos</h1>
          <p className="text-zinc-500 text-sm">
            Gere subscrições e pagamentos dos teus clientes via Stripe.
          </p>
        </div>

        <BillingClient clients={clients} coachId={user.id} />
      </div>
    </div>
  );
}
