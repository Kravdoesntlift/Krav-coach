import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET: return (or create) the client's unique sync token
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();

  // Upsert: create token if not exists, return existing otherwise
  const { data, error } = await admin
    .from("health_tokens")
    .upsert({ client_id: user.id }, { onConflict: "client_id", ignoreDuplicates: true })
    .select()
    .single();

  if (error) {
    // If upsert failed (already exists), just select
    const { data: existing } = await admin
      .from("health_tokens")
      .select("sync_token")
      .eq("client_id", user.id)
      .single();
    if (existing) return NextResponse.json({ token: existing.sync_token });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: data.sync_token });
}

// POST: regenerate token (invalidates old one)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();

  await admin.from("health_tokens").delete().eq("client_id", user.id);
  const { data, error } = await admin
    .from("health_tokens")
    .insert({ client_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data.sync_token });
}
