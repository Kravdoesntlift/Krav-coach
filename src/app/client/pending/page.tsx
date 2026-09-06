import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";
import { getLang } from "@/lib/i18n/getLang";
import { getStripe, syncSubscription } from "@/lib/billing/sync";
import type Stripe from "stripe";

// ─── Post-payment activation ──────────────────────────────────────────────────
// Called when client lands here with ?session_id= from Stripe.
// Verifies the session, activates the profile, sends welcome message + push.
async function activateAfterPayment(userId: string, sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  } catch {
    return; // Network error, the webhook and the nightly job both still cover this
  }

  const clientId = session.metadata?.client_id;
  const coachId = session.metadata?.coach_id ?? null;

  if (!clientId || clientId !== userId) return;
  if (session.payment_status !== "paid") return;

  const admin = createAdminClient();

  // Provision through the shared path so this page cannot disagree with the
  // webhook. It previously set `status` but left `subscription_renews_at` null
  // and never cleared `trial_ends_at`, so a client who paid could still be
  // treated as a lapsed trial until the nightly job repaired them.
  const sub =
    typeof session.subscription === "object" && session.subscription !== null
      ? (session.subscription as Stripe.Subscription)
      : null;

  if (sub) {
    await syncSubscription(admin, { subscription: sub, clientId, coachId });
  } else {
    // Paid, but the subscription object did not come back: at least unlock the
    // account rather than leaving a paying client staring at this page.
    await admin.from("profiles").update({ status: "active" }).eq("id", clientId);
  }

  if (!coachId) return;

  // Ensure coach assignment even when there was no subscription object above
  await admin.from("coach_clients").upsert(
    { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
    { onConflict: "coach_id,client_id,assigned_role" }
  );

  // Send welcome message (only once)
  const { data: existingMsg } = await admin
    .from("messages")
    .select("id")
    .eq("sender_id", coachId)
    .eq("receiver_id", clientId)
    .limit(1)
    .maybeSingle();

  if (!existingMsg) {
    const [{ data: coachData }, { data: clientData }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", coachId).single(),
      admin.from("profiles").select("full_name").eq("id", clientId).single(),
    ]);
    const coachFirst = (coachData?.full_name ?? "").split(" ")[0] || "Coach";
    const clientFirst = (clientData?.full_name ?? "").split(" ")[0] || "Atleta";

    await admin.from("messages").insert({
      sender_id: coachId,
      receiver_id: clientId,
      content: `Olá ${clientFirst}! 👋 Sou o ${coachFirst}, o teu coach na KRAV. O teu pagamento foi confirmado e já tens acesso total à app. Vamos começar esta jornada juntos! 💪`,
    });

    // 5. Push to coach
    await sendPushToUser(
      coachId,
      "Novo cliente pagante! 🎉",
      `${clientFirst} subscreveu o teu programa.`,
      `/coach/clients/${clientId}`,
    ).catch(() => {});

    // 6. Push to client (if they subscribed)
    await sendPushToUser(
      clientId,
      "Pagamento confirmado!",
      "Bem-vindo à KRAV! O teu plano está a ser preparado.",
      "/client/dashboard",
    ).catch(() => {});
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; session_id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const lang = await getLang();

  const { welcome, session_id } = await searchParams;

  // If Stripe redirected here after payment: activate immediately
  if (welcome === "true" && session_id) {
    await activateAfterPayment(user.id, session_id);
  }

  // Re-fetch profile after potential activation
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", user.id)
    .single();

  // Active clients go straight to dashboard
  if (profile?.status === "active") redirect("/client/dashboard");

  const firstName = (profile?.full_name ?? "").split(" ")[0] || (lang === "en" ? "Athlete" : "Atleta");
  const isWelcome = welcome === "true";

  const extra = {
    greeting:         { pt: `Olá, ${firstName}!`, en: `Hi, ${firstName}!` },
    payment_confirmed:{ pt: "Pagamento confirmado! O teu coach vai criar o teu plano personalizado. Receberás uma notificação assim que estiver pronto.", en: "Payment confirmed! Your coach will create your personalised plan. You'll receive a notification when it's ready." },
    account_created:  { pt: "A tua conta foi criada. O teu coach irá ativá-la assim que confirmar o pagamento.", en: "Your account has been created. Your coach will activate it once payment is confirmed." },
    step_account:     { pt: "Conta criada", en: "Account created" },
    step_payment_ok:  { pt: "Pagamento confirmado", en: "Payment confirmed" },
    step_plan:        { pt: "Plano personalizado em preparação", en: "Personalised plan being prepared" },
    step_payment_pend:{ pt: "Pagamento a aguardar confirmação", en: "Payment awaiting confirmation" },
    step_access:      { pt: "Acesso total à app", en: "Full app access" },
    info_welcome:     { pt: "Podes já falar com o teu coach no chat enquanto o plano é preparado.", en: "You can already chat with your coach while the plan is being prepared." },
    info_pending:     { pt: "Já tens acesso ao chat com o teu coach. Fala com ele se tiveres dúvidas.", en: "You already have access to chat with your coach. Contact them if you have any questions." },
    chat_cta:         { pt: "💬 Falar com o coach", en: "💬 Chat with coach" },
    auto_update:      { pt: "Esta página atualiza automaticamente quando o teu acesso for ativado.", en: "This page will update automatically when your access is activated." },
  } as const;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div>
          <span className="text-2xl font-black tracking-tighter text-white">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 space-y-6"
          style={{
            background: "linear-gradient(160deg, rgba(201,168,76,0.1) 0%, rgba(10,10,12,0.95) 100%)",
            border: "1px solid rgba(201,168,76,0.22)",
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.22)" }}
          >
            {isWelcome ? "🎉" : "⏳"}
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-xl font-black tracking-tight">
              {extra.greeting[lang]}
            </h1>
            {isWelcome ? (
              <p className="text-zinc-400 text-sm leading-relaxed">
                {extra.payment_confirmed[lang]}
              </p>
            ) : (
              <p className="text-zinc-400 text-sm leading-relaxed">
                {extra.account_created[lang]}
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {(isWelcome
              ? [
                  { icon: "✅", text: extra.step_account[lang], done: true },
                  { icon: "✅", text: extra.step_payment_ok[lang], done: true },
                  { icon: "⏳", text: extra.step_plan[lang], done: false },
                ]
              : [
                  { icon: "✅", text: extra.step_account[lang], done: true },
                  { icon: "💳", text: extra.step_payment_pend[lang], done: false },
                  { icon: "🚀", text: extra.step_access[lang], done: false },
                ]
            ).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <span className={`text-sm ${s.done ? "text-white font-medium" : "text-zinc-500"}`}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-zinc-400 text-xs leading-relaxed">
              {isWelcome ? extra.info_welcome[lang] : extra.info_pending[lang]}
            </p>
          </div>
        </div>

        {/* Chat link */}
        <a
          href="/client/chat"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-black text-sm transition-all active:scale-95 hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          {extra.chat_cta[lang]}
        </a>

        <p className="text-zinc-600 text-xs">
          {extra.auto_update[lang]}
        </p>
      </div>
    </div>
  );
}
