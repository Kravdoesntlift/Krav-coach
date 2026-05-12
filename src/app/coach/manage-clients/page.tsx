import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ManageClientsClient, { type ClientRow } from "./ManageClientsClient";

export default async function ManageClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify coach
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") redirect("/client/dashboard");

  // All client profiles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, status, avatar_url")
    .eq("role", "client")
    .order("full_name");

  // All assignments (all coaches, so we can show "outro coach" status)
  const { data: allAssignments } = await supabase
    .from("coach_clients")
    .select("coach_id, client_id, assigned_role");

  const assignmentsByClient = new Map<string, { assigned_role: string; coach_id: string }[]>();
  for (const a of allAssignments ?? []) {
    const list = assignmentsByClient.get(a.client_id) ?? [];
    list.push({ assigned_role: a.assigned_role, coach_id: a.coach_id });
    assignmentsByClient.set(a.client_id, list);
  }

  const clients: ClientRow[] = (allProfiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    status: p.status ?? "active",
    avatar_url: p.avatar_url ?? null,
    assignments: assignmentsByClient.get(p.id) ?? [],
  }));

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const inviteUrl = `${siteUrl}/auth/signup?coach=${user.id}`;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/coach/dashboard" className="text-zinc-600 hover:text-white text-sm transition-colors">
              Dashboard
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-white text-sm">Gerir Clientes</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Gerir Clientes</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registado{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/coach/plans/new" className="btn-primary text-sm">
          + Novo Plano
        </Link>
      </div>

      <ManageClientsClient
        allClients={clients}
        coachId={user.id}
        inviteUrl={inviteUrl}
      />
    </div>
  );
}
