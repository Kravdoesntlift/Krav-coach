import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/habits
// Returns: { habits: HabitDefinition[], logs: HabitLog[], today: string }
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [{ data: habits, error: habitsErr }, { data: logs, error: logsErr }] =
    await Promise.all([
      supabase
        .from("habit_definitions")
        .select("id, name, emoji, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("id, habit_id, logged_date")
        .eq("client_id", user.id)
        .eq("logged_date", today),
    ]);

  if (habitsErr) return NextResponse.json({ error: habitsErr.message }, { status: 500 });
  if (logsErr) return NextResponse.json({ error: logsErr.message }, { status: 500 });

  return NextResponse.json({ habits: habits ?? [], logs: logs ?? [], today });
}

// POST /api/habits
// Body: { action: "toggle", habit_id: string, logged_date: string }
//     | { action: "create", name: string, emoji: string }
//     | { action: "delete", habit_id: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const { action } = body;

  if (action === "toggle") {
    const { habit_id, logged_date } = body;
    if (!habit_id || !logged_date)
      return NextResponse.json({ error: "habit_id and logged_date required." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(logged_date) || isNaN(Date.parse(logged_date)))
      return NextResponse.json({ error: "logged_date inválido." }, { status: 400 });

    // Check if log exists
    const { data: existing } = await supabase
      .from("habit_logs")
      .select("id")
      .eq("habit_id", habit_id)
      .eq("client_id", user.id)
      .eq("logged_date", logged_date)
      .maybeSingle();

    if (existing) {
      // Delete (uncheck)
      await supabase.from("habit_logs").delete().eq("id", existing.id);
      return NextResponse.json({ checked: false });
    } else {
      // Create (check)
      const { error } = await supabase.from("habit_logs").insert({
        client_id: user.id,
        habit_id,
        logged_date,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ checked: true });
    }
  }

  if (action === "create") {
    const { name, emoji } = body;
    if (!name?.trim())
      return NextResponse.json({ error: "name required." }, { status: 400 });

    const { data, error } = await supabase
      .from("habit_definitions")
      .insert({ client_id: user.id, name: name.trim(), emoji: emoji ?? "✅" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ habit: data });
  }

  if (action === "delete") {
    const { habit_id } = body;
    if (!habit_id)
      return NextResponse.json({ error: "habit_id required." }, { status: 400 });

    // Delete logs first (or rely on cascade), then definition
    await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habit_id)
      .eq("client_id", user.id);

    const { error } = await supabase
      .from("habit_definitions")
      .delete()
      .eq("id", habit_id)
      .eq("client_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
