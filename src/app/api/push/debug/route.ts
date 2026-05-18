import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/push/debug  — status for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();

  const { data: mySubs } = await admin
    .from("push_subscriptions")
    .select("id, created_at, subscription")
    .eq("user_id", user.id);

  const vapidSubject = process.env.VAPID_SUBJECT ?? null;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? null;

  const vapidOk =
    !!vapidSubject && !!vapidPublic && !!vapidPrivate &&
    (vapidSubject.startsWith("mailto:") || vapidSubject.startsWith("https://"));

  return NextResponse.json({
    userId: user.id,
    deviceCount: mySubs?.length ?? 0,
    devices: (mySubs ?? []).map((s) => ({
      id: s.id,
      subscribedAt: s.created_at,
      endpoint: (s.subscription as { endpoint?: string })?.endpoint?.slice(0, 60) + "...",
    })),
    vapid: {
      ok: vapidOk,
      subject: vapidSubject,
      publicKey: vapidPublic ? vapidPublic.slice(0, 20) + "..." : null,
      privateKey: vapidPrivate ? "✓ set" : "✗ missing",
      error: !vapidSubject ? "VAPID_SUBJECT missing" :
             !vapidPublic ? "NEXT_PUBLIC_VAPID_PUBLIC_KEY missing" :
             !vapidPrivate ? "VAPID_PRIVATE_KEY missing" :
             (!vapidSubject.startsWith("mailto:") && !vapidSubject.startsWith("https://"))
               ? `VAPID_SUBJECT must start with 'mailto:' or 'https://' — got: ${vapidSubject}`
               : null,
    },
  });
}

// POST /api/push/debug  — send test notification to self
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { sendPushToUser } = await import("@/lib/push");
  const result = await sendPushToUser(
    user.id,
    "✅ Teste KRAV Coach",
    "Notificações push estão a funcionar neste dispositivo!",
    "/",
  );

  return NextResponse.json(result.ok
    ? { ok: true, message: "Notificação enviada!" }
    : { ok: false, error: result.error }
  );
}
