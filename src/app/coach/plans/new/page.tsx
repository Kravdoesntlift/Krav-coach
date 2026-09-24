import { createClient } from "@/lib/supabase/server";
import PlanBuilder from "@/components/coach/PlanBuilder";
import type { Profile, WorkoutPlan } from "@/lib/supabase/types";

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; suggest?: string; from?: string }>;
}) {
  const { client: preselectedClientId, suggest, from } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clients }, { data: templates }, { data: libraryItems }, { data: seed }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("full_name"),
    supabase.from("plan_templates").select("*").eq("coach_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("exercise_library").select("id,name,muscle_groups,description,video_url").eq("coach_id", user!.id).order("name"),
    // ?from=<planId>: start from a week the client already trained, usually the
    // base plan the app wrote for their trial.
    from
      ? supabase
          .from("workout_plans")
          .select("*, workout_days(*, exercises(*))")
          .eq("id", from)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novo Plano de Treino</h1>
        <p className="text-gray-400 text-sm mt-1">
          {seed
            ? `A partir de "${(seed as WorkoutPlan).name}". Edita o que quiseres: isto cria um plano novo, não altera o antigo.`
            : "Cria e atribui um plano semanal a um cliente."}
        </p>
      </div>

      <PlanBuilder
        coachId={user!.id}
        clients={(clients as Profile[]) ?? []}
        preselectedClientId={preselectedClientId}
        templates={templates ?? []}
        seedPlan={(seed as WorkoutPlan) ?? undefined}
        suggestMode={suggest === "true"}
        libraryItems={libraryItems ?? []}
      />
    </div>
  );
}
