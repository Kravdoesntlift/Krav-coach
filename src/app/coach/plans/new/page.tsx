import { createClient } from "@/lib/supabase/server";
import PlanBuilder from "@/components/coach/PlanBuilder";
import type { Profile } from "@/lib/supabase/types";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; suggest?: string }>;
}) {
  const { client: preselectedClientId, suggest } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clients }, { data: templates }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("full_name"),
    supabase.from("plan_templates").select("*").eq("coach_id", user!.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novo Plano de Treino</h1>
        <p className="text-gray-400 text-sm mt-1">
          Cria e atribui um plano semanal a um cliente.
        </p>
      </div>

      <PlanBuilder
        coachId={user!.id}
        clients={(clients as Profile[]) ?? []}
        preselectedClientId={preselectedClientId}
        templates={templates ?? []}
        suggestMode={suggest === "true"}
      />
    </div>
  );
}
