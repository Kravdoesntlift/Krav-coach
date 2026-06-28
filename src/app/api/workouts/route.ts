import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("client_workouts")
    .select("*")
    .eq("client_id", user.id)
    .order("date", { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workouts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const { title, type, date, duration_min, notes, calories, distance_km } = body as {
    title?: string;
    type?: string;
    date?: string;
    duration_min?: number;
    notes?: string;
    calories?: number;
    distance_km?: number;
  };

  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });

  const validTypes = ["strength", "cardio", "sports", "yoga", "mobility", "other"];
  const { data, error } = await supabase
    .from("client_workouts")
    .insert({
      client_id: user.id,
      title: title.trim(),
      type: validTypes.includes(type ?? "") ? type : "other",
      date: date ?? new Date().toISOString().slice(0, 10),
      duration_min: duration_min && duration_min > 0 ? Math.round(duration_min) : null,
      calories: calories && calories > 0 ? Math.round(calories) : null,
      distance_km: distance_km && distance_km > 0 ? distance_km : null,
      notes: notes?.trim() || null,
      source: "manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workout: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 });

  const { error } = await supabase
    .from("client_workouts")
    .delete()
    .eq("id", id)
    .eq("client_id", user.id); // RLS extra guard

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
