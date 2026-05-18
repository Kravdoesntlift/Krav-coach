import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push";

// ─── Post-payment activation ──────────────────────────────────────────────────
// Called when client lands here with ?session_id= from Stripe.
// Verifies the session, activates the profile, sends welcome message + push.
async function activateAfterPayment(userId: string, sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) return;

  // Retrieve session via raw fetch — bypass Stripe SDK networking issues
  type StripeSession = {
    metadata?: Record<string, string>;
    payment_status?: string;
    subscription?: {
      id: string;
      status: string;
      items?: { data: Array<{ price?: { unit_amount: number | null }; current_period_end?: number }> };
    } | string | null;
  };

  let session: StripeSession;
  try {
    const resp = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
      {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) return;
    session = await resp.json() as StripeSession;
  } catch {
    return; // Network error — ignore
  }

  const clientId = session.metadata?.client_id;
  const coachId = session.metadata?.coach_id;

  if (!clientId || clientId !== userId) return;
  if (session.payment_status !== "paid") return;

  const admin = createAdminClient();

  // 1. Activate profile
  await admin.from("profiles").update({ status: "active" }).eq("id", clientId);

  // 2. Store subscription in DB (if not already there)
  const sub = typeof session.subscription === "object" && session.subscription !== null
    ? session.subscription
    : null;
  if (sub && coachId) {
    const item = sub.items?.data[0];
    const amountCents = item?.price?.unit_amount ?? null;
    const periodEndTs = item?.current_period_end ?? null;
    const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

    await admin.from("stripe_subscriptions").upsert(
      {
        id: sub.id,
        client_id: clientId,
        coach_id: coachId,
        status: sub.status,
        amount_cents: amountCents,
        current_period_end: periodEnd,
      },
      { onConflict: "id" }
    );
  }

  if (!coachId) return;

  // 3. Ensure coach assignment
  await admin.from("coach_clients").upsert(
    { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
    { onConflict: "coach_id,client_id,assigned_role" }
  );

  // 4. Send welcome message (only once)
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

  const { welcome, session_id } = await searchParams;

  // If Stripe redirected here after payment — activate immediately
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

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Atleta";
  const isWelcome = welcome === "true";

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
            background: "linear-gradient(160deg, rgba(201,168,76,0.08) 0%, rgba(10,10,12,0.95) 100%)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl"
            style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            {isWelcome ? "🎉" : "⏳"}
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-xl font-black tracking-tight">
              Olá, {firstName}!
            </h1>
            {isWelcome ? (
              <p className="text-zinc-400 text-sm leading-relaxed">
                Pagamento confirmado! O teu coach vai criar o teu plano personalizado.
                Receberás uma notificação assim que estiver pronto.
              </p>
            ) : (
              <p className="text-zinc-400 text-sm leading-relaxed">
                A tua conta foi criada. O teu coach irá ativá-la assim que confirmar o pagamento.
              </p>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {(isWelcome
              ? [
                  { icon: "✅", text: "Conta criada", done: true },
                  { icon: "✅", text: "Pagamento confirmado", done: true },
                  { icon: "⏳", text: "Plano personalizado em preparação", done: false },
                ]
              : [
                  { icon: "✅", text: "Conta criada", done: true },
                  { icon: "💳", text: "Pagamento a aguardar confirmação", done: false },
                  { icon: "🚀", text: "Acesso total à app", done: false },
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
              {isWelcome
                ? "Podes já falar com o teu coach no chat enquanto o plano é preparado."
                : "Já tens acesso ao chat com o teu coach. Fala com ele se tiveres dúvidas."}
            </p>
          </div>
        </div>

        {/* Chat link */}
        <a
          href="/client/chat"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-black text-sm transition-all active:scale-95 hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          💬 Falar com o coach
        </a>

        <p className="text-zinc-600 text-xs">
          Esta página atualiza automaticamente quando o teu acesso for ativado.
        </p>
      </div>
    </div>
  );
}
