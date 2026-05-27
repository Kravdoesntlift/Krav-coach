import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PlanBuilder from "@/components/coach/PlanBuilder";
import type { WorkoutPlan } from "@/lib/supabase/types";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: plan }, { data: libraryItems }] = await Promise.all([
    supabase.from("workout_plans").select(`*, workout_days(*, exercises(*))`).eq("id", planId).eq("coach_id", user!.id).single(),
    supabase.from("exercise_library").select("id,name,muscle_groups,description,video_url").eq("coach_id", user!.id).order("name"),
  ]);

  if (!plan) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Editar Plano</h1>
        <p className="text-gray-400 text-sm mt-1">{plan.name}</p>
      </div>

      <PlanBuilder
        coachId={user!.id}
        clients={[]}
        existingPlan={plan as unknown as WorkoutPlan}
        libraryItems={libraryItems ?? []}
      />
    </div>
  );
}
