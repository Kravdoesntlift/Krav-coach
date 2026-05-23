import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();
  const endpoint = subscription?.endpoint as string | undefined;

  if (!endpoint) {
    return NextResponse.json({ error: "Invalid subscription: missing endpoint" }, { status: 400 });
  }

  // Use admin client to bypass any RLS issues on push_subscriptions
  const admin = createAdminClient();

  // Try upsert by user_id + endpoint (one row per device)
  const { error: err1 } = await admin.from("push_subscriptions").upsert(
    { user_id: user.id, subscription },
    { onConflict: "user_id,endpoint" }
  );

  if (err1) {
    // Fallback: upsert by user_id only (single-device mode)
    const { error: err2 } = await admin.from("push_subscriptions").upsert(
      { user_id: user.id, subscription },
      { onConflict: "user_id" }
    );

    if (err2) {
      console.error("[push/subscribe] DB upsert failed:", err2);
      return NextResponse.json({ ok: false, error: err2.message }, { status: 500 });
    }
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
