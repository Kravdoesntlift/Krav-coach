import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialReminderEmail, sendTrialEndEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  // Only coaches can call this
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: coach } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (coach?.role !== "coach") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId } = await req.json() as { clientId: string };
  if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch client profile + email
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("full_name, lang, trial_ends_at").eq("id", clientId).single(),
    admin.auth.admin.getUserById(clientId),
  ]);

  const email = authUser?.user?.email;
  if (!email) return NextResponse.json({ error: "Client has no email" }, { status: 404 });

  const cLang: "pt" | "en" = (profile?.lang === "en") ? "en" : "pt";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";
  const clientName = profile?.full_name ?? "";

  // Calculate days left
  let daysLeft = 0;
  if (profile?.trial_ends_at) {
    const now = new Date();
    const trialEnd = new Date(profile.trial_ends_at);
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const endUTC   = Date.UTC(trialEnd.getUTCFullYear(), trialEnd.getUTCMonth(), trialEnd.getUTCDate());
    daysLeft = Math.max(0, Math.round((endUTC - todayUTC) / 86_400_000));
  }

  try {
    if (daysLeft === 0) {
      await Promise.allSettled([
        sendTrialEndEmail({ to: email, clientName, siteUrl, lang: cLang }),
        sendPushToUser(clientId,
          cLang === "en" ? "⏰ Your KRAV trial has ended" : "⏰ O teu trial KRAV terminou",
          cLang === "en" ? "Subscribe to keep your plan, history and coach access." : "Subscreve para manter o teu plano, histórico e acesso ao coach.",
          "/client/dashboard",
        ),
      ]);
    } else {
      await Promise.allSettled([
        sendTrialReminderEmail({ to: email, clientName, daysLeft: daysLeft > 0 ? daysLeft : 1, siteUrl, lang: cLang }),
        sendPushToUser(clientId,
          cLang === "en"
            ? (daysLeft === 1 ? "⏰ Last day of trial!" : `⚠️ Trial ends in ${daysLeft} days`)
            : (daysLeft === 1 ? "⏰ Último dia de trial!" : `⚠️ O teu trial termina em ${daysLeft} dias`),
          cLang === "en" ? "Activate your subscription to keep access." : "Activa a tua subscrição para continuar.",
          "/client/dashboard",
        ),
      ]);
    }

    return NextResponse.json({ ok: true, daysLeft, email });
  } catch (err) {
    console.error("[send-trial-reminder]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
