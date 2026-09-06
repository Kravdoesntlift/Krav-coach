import { createAdminClient } from "@/lib/supabase/admin";
import WorkoutWeek from "@/components/client/WorkoutWeek";
import { LangProvider } from "@/components/LangProvider";
import type { WorkoutPlan } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function UiAudit() {
  const admin = createAdminClient();
  const CLIENT = "7b5b91de-6aa7-4990-b3a4-ad3421157eda";
  const COACH = "8aedf243-4432-445d-b485-fa874dece3cb";

  const { data: plan } = await admin
    .from("workout_plans")
    .select("*, workout_days(*, exercises(*), workout_completions(client_id))")
    .eq("client_id", CLIENT)
    .order("week_start")
    .limit(1)
    .single();

  return (
    <LangProvider>
      <div className="min-h-screen bg-black">
        <WorkoutWeek plan={plan as unknown as WorkoutPlan} clientId={CLIENT} coachId={COACH} />
      </div>
    </LangProvider>
  );
}
