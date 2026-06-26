import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/nutrition/goals?clientId=xxx — coach fetches client's current goals
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId obrigatório." }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return NextResponse.json({ error: "Apenas coaches." }, { status: 403 });

  const admin = createAdminClient();

  // Verify coach-client relationship before exposing client data
  const { data: rel } = await supabase.from("coach_clients")
    .select("id").eq("coach_id", user.id).eq("client_id", clientId).maybeSingle();
  if (!rel) return NextResponse.json({ error: "Sem acesso a este cliente." }, { status: 403 });

  const { data } = await admin
    .from("client_nutrition_goals")
    .select("target_calories,target_protein_g,target_carbs_g,target_fat_g,goal")
    .eq("client_id", clientId)
    .maybeSingle();

  return NextResponse.json({ goals: data ?? null });
}

// POST /api/nutrition/goals — coach sets macro targets for a client
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return NextResponse.json({ error: "Apenas coaches." }, { status: 403 });

  const body = await req.json() as {
    clientId: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goal?: string;
  };

  const { clientId, calories, protein, carbs, fat, goal } = body;
  if (!clientId) return NextResponse.json({ error: "clientId obrigatório." }, { status: 400 });
  const validMacro = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 10000;
  if (!validMacro(calories) || !validMacro(protein) || !validMacro(carbs) || !validMacro(fat)) {
    return NextResponse.json({ error: "Valores de macros inválidos." }, { status: 400 });
  }

  // Verify coach–client relationship
  const { data: rel } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!rel) return NextResponse.json({ error: "Sem acesso a este cliente." }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.from("client_nutrition_goals").upsert(
    {
      client_id: clientId,
      target_calories: calories,
      target_protein_g: protein,
      target_carbs_g: carbs,
      target_fat_g: fat,
      goal: goal ?? "maintenance",
      // Required fields with safe defaults if not already set
      weight_kg: null,
      height_cm: null,
      age: null,
      sex: null,
      activity_level: "moderate",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
