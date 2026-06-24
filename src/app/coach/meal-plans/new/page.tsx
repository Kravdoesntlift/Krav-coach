import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import MealPlanBuilder, { type ClientOption } from "./MealPlanBuilder";

export default async function NewMealPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all clients assigned to this coach
  const { data: assignments } = await supabase
    .from("coach_clients")
    .select("client_id, profiles!coach_clients_client_id_fkey(id, full_name)")
    .eq("coach_id", user.id);

  const clientMap = new Map<string, ClientOption>();
  for (const row of assignments ?? []) {
    const p = row.profiles as unknown as { id: string; full_name: string } | null;
    if (p && !clientMap.has(p.id)) clientMap.set(p.id, { id: p.id, full_name: p.full_name });
  }
  const clients: ClientOption[] = Array.from(clientMap.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  return (
    <div className="space-y-6 page-enter">
      <div>
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Link href="/coach/dashboard" className="hover:text-zinc-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/coach/meal-plans" className="hover:text-zinc-300 transition-colors">
            Planos Alimentares
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Novo</span>
        </nav>
        <h1 className="text-2xl font-bold text-white">Novo Plano Alimentar</h1>
        <p className="text-gray-400 text-sm mt-1">
          Cria um plano personalizado com refeições e macros
        </p>
      </div>

      <MealPlanBuilder clients={clients} />
    </div>
  );
}
