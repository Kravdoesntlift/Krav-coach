"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
export async function saveOnboarding(data: {
  clientId: string;
  fitnessLevel: string;
  goalsText: string | null;
  injuries: string | null;
  availability: number;
  equipment: string | null;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("client_onboarding").upsert({
    client_id:     data.clientId,
    fitness_level: data.fitnessLevel,
    goals_text:    data.goalsText,
    injuries:      data.injuries,
    availability:  data.availability,
    equipment:     data.equipment,
    completed_at:  new Date().toISOString(),
  }, { onConflict: "client_id" });

  if (error) return { error: error.message };
  return { ok: true };
}
