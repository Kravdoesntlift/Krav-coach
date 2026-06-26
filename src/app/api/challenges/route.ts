import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/challenges — upsert monthly challenge (coach only)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return NextResponse.json({ error: "Apenas coaches." }, { status: 403 });

  const body = await req.json();
  const {
    month,
    reward_title,
    reward_description,
    reward_image_url,
    points_per_workout,
    points_per_checkin,
    points_per_nutrition,
    points_per_1000_steps,
  } = body as Record<string, string | number | undefined>;

  if (!month || !reward_title) {
    return NextResponse.json({ error: "month e reward_title são obrigatórios." }, { status: 400 });
  }
  if (reward_image_url && (typeof reward_image_url !== "string" || !reward_image_url.startsWith("https://"))) {
    return NextResponse.json({ error: "reward_image_url deve ser uma URL HTTPS válida." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("monthly_challenges")
    .upsert(
      {
        coach_id: user.id,
        month,
        reward_title,
        reward_description: reward_description ?? null,
        reward_image_url: reward_image_url ?? null,
        points_per_workout: points_per_workout ?? 10,
        points_per_checkin: points_per_checkin ?? 15,
        points_per_nutrition: points_per_nutrition ?? 5,
        points_per_1000_steps: points_per_1000_steps ?? 2,
      },
      { onConflict: "coach_id,month" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ challenge: data });
}

// PATCH /api/challenges — announce winner
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return NextResponse.json({ error: "Apenas coaches." }, { status: 403 });

  const { challengeId, winner_client_id } = await req.json() as { challengeId: string; winner_client_id: string };
  if (!challengeId || !winner_client_id) {
    return NextResponse.json({ error: "challengeId e winner_client_id obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("monthly_challenges")
    .update({ winner_client_id, winner_announced: true })
    .eq("id", challengeId)
    .eq("coach_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ challenge: data });
}
