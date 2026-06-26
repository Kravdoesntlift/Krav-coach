import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, title, body, url } = await req.json();

  // Verify caller has a relationship with the target user
  const { data: rel } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", userId)
    .maybeSingle();
  // Also allow coach to notify themselves (e.g. test)
  if (!rel && userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch subscription + unread count in parallel
  const [{ data: sub }, { count: unread }] = await Promise.all([
    admin.from("push_subscriptions").select("subscription").eq("user_id", userId).single(),
    admin.from("messages").select("id", { count: "exact", head: true })
      .eq("receiver_id", userId).is("read_at", null),
  ]);

  if (!sub?.subscription) {
    return NextResponse.json({ error: "No subscription" }, { status: 404 });
  }

  // badge = actual unread count (message is already inserted before push is called)
  // minimum 1 so the badge always shows something when a notification fires
  const badge = Math.max(1, unread ?? 0);

  try {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({ title, body, url, badge }),
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410) {
      await admin.from("push_subscriptions").delete().eq("user_id", userId);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
