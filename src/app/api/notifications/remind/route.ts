import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/notifications/remind
// Body: { type: "workout" | "checkin" | "custom", clientId?: string, message?: string }
// Sends push notification to one or all clients of the coach.

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Only coaches can send notifications
  const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "coach") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { type: string; clientId?: string; message?: string };
  const admin = createAdminClient();

  const MESSAGES: Record<string, { title: string; body: string }> = {
    workout: { title: "💪 Hora de treinar!", body: "O teu plano de treino está à tua espera. Vai lá!" },
    checkin: { title: "📊 Check-in semanal", body: "Não te esqueças de registar o teu progresso desta semana." },
    custom: { title: "📬 Mensagem do teu coach", body: body.message ?? "Tens uma nova mensagem." },
  };

  const notif = MESSAGES[body.type] ?? MESSAGES.custom;

  // Get target clients
  let targetIds: string[] = [];
  if (body.clientId) {
    const { data: rel } = await admin.from("coach_clients")
      .select("id").eq("coach_id", user.id).eq("client_id", body.clientId).maybeSingle();
    if (!rel) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    targetIds = [body.clientId];
  } else {
    const { data: plans } = await admin
      .from("workout_plans")
      .select("client_id")
      .eq("coach_id", user.id);
    targetIds = [...new Set((plans ?? []).map((p) => p.client_id))];
  }

  if (targetIds.length === 0) return NextResponse.json({ sent: 0 });

  // Get push subscriptions
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .in("user_id", targetIds);

  if (!subs?.length) return NextResponse.json({ sent: 0, note: "No subscriptions found" });

  // Lazy-import web-push
  const webpush = await import("web-push");
  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.default.sendNotification(
          sub.subscription as Parameters<typeof webpush.default.sendNotification>[0],
          JSON.stringify({ title: notif.title, body: notif.body, icon: "/icon.svg" })
        );
        sent++;
      } catch { /* expired subscription */ }
    })
  );

  return NextResponse.json({ sent });
}
