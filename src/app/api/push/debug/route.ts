import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

async function getCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return null;
  return user;
}

// GET /api/push/debug: push status for a given client (coach only)
export async function GET(req: Request) {
  const coach = await getCoach();
  if (!coach) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? coach.id;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, created_at, subscription")
    .eq("user_id", userId);

  const vapidSubject = process.env.VAPID_SUBJECT ?? null;
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? null;
  const vapidOk =
    !!vapidSubject && !!vapidPublic && !!vapidPrivate &&
    (vapidSubject.startsWith("mailto:") || vapidSubject.startsWith("https://"));

  return NextResponse.json({
    userId,
    deviceCount: subs?.length ?? 0,
    devices: (subs ?? []).map((s) => ({
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
             !vapidPublic  ? "NEXT_PUBLIC_VAPID_PUBLIC_KEY missing" :
             !vapidPrivate ? "VAPID_PRIVATE_KEY missing" :
             (!vapidSubject.startsWith("mailto:") && !vapidSubject.startsWith("https://"))
               ? `VAPID_SUBJECT must start with 'mailto:' or 'https://', got: ${vapidSubject}`
               : null,
    },
  });
}

// POST /api/push/debug: send test notification to the current user (any role)
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const result = await sendPushToUser(
    user.id,
    "✅ Teste KRAV Coach",
    "Notificações push estão a funcionar neste dispositivo!",
    "/client/dashboard",
  );

  if (result.ok) return NextResponse.json({ ok: true, message: "Notificação enviada!" });

  const friendlyError = result.error?.includes("No subscription found")
    ? "Ativa as notificações primeiro tocando no sino 🔔"
    : (result.error ?? "Erro desconhecido");

  return NextResponse.json({ ok: false, error: friendlyError });
}
