import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

async function checkStripeHealth(): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  try {
    const resp = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

function CheckItem({
  done,
  label,
  description,
  action,
}: {
  done: boolean;
  label: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-2xl p-4"
      style={{
        background: "rgba(18,18,20,0.8)",
        border: `1px solid ${done ? "rgba(74,222,128,0.2)" : "rgba(39,39,42,0.5)"}`,
      }}
    >
      <div
        className="flex-none mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          background: done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
          color: done ? "#4ade80" : "#52525b",
        }}
      >
        {done ? "✓" : "○"}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${done ? "text-white" : "text-zinc-400"}`}>{label}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
      </div>
      {!done && action && (
        <Link
          href={action.href}
          className="flex-none px-3 py-1.5 rounded-xl text-xs font-semibold text-black transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default async function CoachSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [
    { data: profile },
    { count: clientCount },
    { count: pushCount },
    stripeOk,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, tagline, avatar_url").eq("id", user.id).single(),
    supabase.from("coach_clients").select("*", { count: "exact", head: true }).eq("coach_id", user.id),
    supabase.from("push_subscriptions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    checkStripeHealth(),
  ]);

  const hasName = !!(profile?.full_name?.trim());
  const hasTagline = !!(profile?.tagline?.trim());
  const hasAvatar = !!(profile?.avatar_url?.trim());
  const hasPush = (pushCount ?? 0) > 0;
  const hasClient = (clientCount ?? 0) > 0;

  const steps = [
    {
      done: hasName,
      label: "Nome do coach configurado",
      description: "O teu nome aparece nos planos e mensagens enviados aos clientes.",
      action: { href: "/coach/profile", label: "Completar" },
    },
    {
      done: hasTagline,
      label: "Tagline / especialidade definida",
      description: "Aparece na página de registo dos clientes, ex. \"Personal trainer · Força & Nutrição\".",
      action: { href: "/coach/profile", label: "Adicionar" },
    },
    {
      done: hasAvatar,
      label: "Foto de perfil carregada",
      description: "Transmite profissionalismo e confiança aos novos clientes.",
      action: { href: "/coach/profile", label: "Carregar" },
    },
    {
      done: stripeOk,
      label: "Pagamentos Stripe ativos",
      description: "A chave Stripe está configurada corretamente. Podes aceitar pagamentos.",
      action: { href: "/api/stripe/health", label: "Verificar" },
    },
    {
      done: hasPush,
      label: "Notificações push ativas",
      description: "Recebe alertas de check-ins, mensagens e pagamentos no dispositivo.",
      action: { href: "/coach/dashboard", label: "Ativar na app" },
    },
    {
      done: hasClient,
      label: "Primeiro cliente inscrito",
      description: "Partilha o teu link de registo: kravcoaching.com/start",
      action: { href: "/coach/dashboard", label: "Ver clientes" },
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  return (
    <div className="space-y-8 page-enter max-w-xl mx-auto">
      <div>
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1">Configuração</p>
        <h1 className="text-2xl font-black text-white">Onboarding do Coach</h1>
        <p className="text-zinc-500 text-sm mt-1">Completa estes passos para estar pronto a receber clientes.</p>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}
      >
        <div className="flex items-end justify-between mb-3">
          <p className="text-sm font-semibold text-zinc-300">
            {allDone ? "Tudo pronto! 🎉" : `${doneCount} de ${steps.length} completos`}
          </p>
          <p className="text-xs text-zinc-500">{progress}%</p>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: allDone
                ? "linear-gradient(90deg,#4ade80,#22c55e)"
                : "linear-gradient(90deg,#E8C96B,#A8893A)",
            }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {steps.map((step) => (
          <CheckItem key={step.label} {...step} />
        ))}
      </div>

      {allDone && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}
        >
          <p className="text-green-400 font-black text-lg">Perfil 100% completo</p>
          <p className="text-zinc-500 text-sm mt-1">Estás pronto para receber e acompanhar clientes.</p>
          <Link
            href="/coach/dashboard"
            className="inline-block mt-4 px-6 py-3 rounded-2xl font-bold text-black text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Ir para o Dashboard
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div>
        <p className="text-xs text-zinc-600 font-semibold uppercase tracking-widest mb-3">Recursos úteis</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/coach/analytics", label: "📊 Analytics", desc: "Métricas em tempo real" },
            { href: "/coach/messages",  label: "💬 Mensagens", desc: "Chat com clientes" },
            { href: "/coach/plans/new", label: "📋 Criar Plano", desc: "Plano semanal de treino" },
            { href: "/start",           label: "🔗 Link de registo", desc: "kravcoaching.com/start" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl p-4 transition-colors hover:border-zinc-600"
              style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}
            >
              <p className="text-sm font-semibold text-white">{link.label}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
