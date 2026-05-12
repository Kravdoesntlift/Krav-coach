import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") redirect("/client/dashboard");

  const { data: items } = await supabase
    .from("client_transformations")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/coach/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-300">Resultados</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Resultados dos Clientes</h1>
          <p className="text-zinc-500 text-sm">
            Adiciona transformações para mostrar no teu perfil público.
          </p>
        </div>

        <ResultsClient items={items ?? []} coachId={user.id} />
      </div>
    </div>
  );
}
