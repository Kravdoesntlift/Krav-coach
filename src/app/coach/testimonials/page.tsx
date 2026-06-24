import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import TestimonialsClient from "./TestimonialsClient";

export default async function CoachTestimonialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") redirect("/client/dashboard");

  // Fetch all testimonials for this coach
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select(
      "id, client_id, display_name, content, result_highlight, duration_weeks, is_public, requested_at, submitted_at"
    )
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch clients for the request form (from coach_clients)
  const { data: clientRows } = await supabase
    .from("coach_clients")
    .select("client_id, profiles!coach_clients_client_id_fkey(id, full_name)")
    .eq("coach_id", user.id)
    .eq("assigned_role", "coach");

  const clients = (clientRows ?? [])
    .map((r) => {
      const p = r.profiles as unknown as { id: string; full_name: string } | null;
      return p ? { id: p.id, full_name: p.full_name } : null;
    })
    .filter((c): c is { id: string; full_name: string } => c !== null)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link
              href="/coach/dashboard"
              className="hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Testemunhos</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Testemunhos</h1>
          <p className="text-zinc-500 text-sm">
            Pede e gere testemunhos dos teus clientes. Os aprovados aparecem no teu perfil público.
          </p>
        </div>

        <TestimonialsClient
          testimonials={testimonials ?? []}
          clients={clients}
        />
      </div>
    </div>
  );
}
