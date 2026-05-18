import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();
  const endpoint = subscription?.endpoint as string | undefined;

  if (!endpoint) {
    return NextResponse.json({ error: "Invalid subscription: missing endpoint" }, { status: 400 });
  }

  // Upsert by user_id + endpoint so each device gets its own row
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, subscription },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    // Fallback: try upsert by user_id only (if migration hasn't run yet)
    await supabase.from("push_subscriptions").upsert(
      { user_id: user.id, subscription },
      { onConflict: "user_id" }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try to get the current device's subscription endpoint from the request
  // If not possible, delete all subscriptions for this user
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
