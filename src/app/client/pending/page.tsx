import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // If already active, go to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.status !== "pending") redirect("/client/dashboard");

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Atleta";
  const { welcome } = await searchParams;
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
                A tua conta foi criada com sucesso. O teu coach irá ativá-la assim que confirmar o pagamento.
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
                  { icon: "💳", text: "Pagamento confirmado pelo coach", done: false },
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
                ? "Receberás uma notificação assim que o teu plano estiver pronto. Podes tambem falar com o teu coach no chat."
                : "Ja tens acesso ao chat com o teu coach. Fala com ele se tiveres duvidas sobre o pagamento."}
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
