import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/push/debug
// Returns push subscription status for the current user + all subscriptions (admin only for coaches)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();

  // Check current user subscription
  const { data: mySub, error: mySubErr } = await admin
    .from("push_subscriptions")
    .select("user_id, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // All subscriptions (coach debug)
  const { data: allSubs } = await admin
    .from("push_subscriptions")
    .select("user_id, created_at");

  // Workout plans for this user as client
  const { data: plansAsClient } = await admin
    .from("workout_plans")
    .select("coach_id")
    .eq("client_id", user.id);

  const coachIds = [...new Set((plansAsClient ?? []).map((p) => p.coach_id))];

  // Check if those coaches have subscriptions
  const coachSubStatus: Record<string, boolean> = {};
  for (const cid of coachIds) {
    coachSubStatus[cid] = (allSubs ?? []).some((s) => s.user_id === cid);
  }

  return NextResponse.json({
    userId: user.id,
    hasSubscription: !!mySub,
    subscriptionError: mySubErr?.message ?? null,
    subscribedAt: mySub?.created_at ?? null,
    totalSubscriptionsInDB: allSubs?.length ?? 0,
    coachIds,
    coachSubscriptionStatus: coachSubStatus,
    vapidConfigured: !!(
      process.env.VAPID_SUBJECT &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
    ),
  });
}

// POST /api/push/debug
// Sends a test notification to yourself
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.subscription) {
    return NextResponse.json({ error: "Sem subscrição para este utilizador. Ativa as notificações primeiro." });
  }

  const webpush = await import("web-push");
  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  try {
    await webpush.default.sendNotification(
      sub.subscription as Parameters<typeof webpush.default.sendNotification>[0],
      JSON.stringify({
        title: "✅ Teste KRAV Coach",
        body: "Notificações push estão a funcionar!",
        url: "/",
        icon: "/icon.svg",
      })
    );
    return NextResponse.json({ ok: true, message: "Notificação enviada!" });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410) {
      await admin.from("push_subscriptions").delete().eq("user_id", user.id);
    }
    return NextResponse.json({ error: error.message, statusCode: error.statusCode }, { status: 500 });
  }
}
