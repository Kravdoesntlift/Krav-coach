import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function LandingPage() {
  const admin = createAdminClient();

  // Fetch the coach (solo-coach app — takes the first active coach)
  const { data: coach } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, tagline")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  const signupUrl = coach ? `/auth/signup?coach=${coach.id}` : `/auth/signup`;
  const initials = coach?.full_name
    ? coach.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "K";

  const features = [
    {
      icon: "📋",
      title: "Plano 100% personalizado",
      desc: "Criado pelo teu coach com base no teu nível, objetivos e equipamento disponível.",
    },
    {
      icon: "📱",
      title: "App no teu telemóvel",
      desc: "Instala como app, treina offline, recebe notificações. Funciona em iOS e Android.",
    },
    {
      icon: "💬",
      title: "Chat direto com o coach",
      desc: "Tira dúvidas, partilha resultados e mantém-te motivado em tempo real.",
    },
    {
      icon: "📊",
      title: "Acompanhamento semanal",
      desc: "Check-ins, feedback e ajustes contínuos ao plano conforme a tua evolução.",
    },
    {
      icon: "🏆",
      title: "Registo de progresso",
      desc: "Peso, medidas, recordes pessoais e conquistas para veres até onde chegaste.",
    },
    {
      icon: "⚡",
      title: "Modo de treino ao vivo",
      desc: "Timer de descanso, registo de séries e pesos — tudo durante o treino.",
    },
  ];

  const steps = [
    { n: "1", title: "Inscreve-te", desc: "Regista-te em menos de 1 minuto. Gratuito para experimentar." },
    { n: "2", title: "Recebe o teu plano", desc: "O coach cria um plano personalizado para ti nas primeiras 24h." },
    { n: "3", title: "Treina com suporte", desc: "Segue o plano, regista os treinos e acompanha a tua evolução." },
  ];

  const included = [
    "Plano de treino semanal personalizado",
    "Ajustes semanais ao plano",
    "Check-ins e análise de progresso",
    "Chat privado com o coach",
    "Registo de séries, pesos e medidas",
    "Fotos de progresso",
    "Recordes pessoais e conquistas",
    "Relatório mensal de progresso",
    "Notificações e lembretes",
    "Acesso à app iOS e Android",
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ambient top glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        {/* ── NAV ──────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
          <span className="text-xl font-black tracking-tighter">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
          <Link
            href="/auth/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Entrar →
          </Link>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pt-10 pb-16 text-center space-y-7">
          {/* Coach badge */}
          {coach && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
              style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt={coach.full_name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
                  {initials}
                </div>
              )}
              <span className="text-brand-gold text-sm font-semibold">{coach.full_name}</span>
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.03em] leading-[1.05]">
              O teu treino.<br />
              <span style={{
                background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Personalizado.
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm mx-auto">
              {coach?.tagline || "Coaching fitness premium com acompanhamento real — no teu telemóvel, 24/7."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={signupUrl}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Começar agora — €127/mês
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-zinc-400 text-base border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-zinc-600 text-xs">
            Sem contratos. Cancela quando quiseres.
          </p>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-16 space-y-5">
          <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
            Tudo o que está incluído
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 space-y-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-2xl">{f.icon}</div>
                <p className="text-white font-bold text-sm">{f.title}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-16 space-y-6">
          <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
            Como funciona
          </p>
          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {s.n}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{s.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── INSTALL ──────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-16 space-y-6">
          <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
            Instala a app no teu telemóvel
          </p>
          <p className="text-zinc-400 text-sm text-center -mt-2">
            Funciona como uma app nativa — sem precisar de ir à App Store.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* iOS */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  🍎
                </div>
                <div>
                  <p className="text-white font-bold text-sm">iPhone / iPad</p>
                  <p className="text-zinc-500 text-xs">Safari</p>
                </div>
              </div>
              <ol className="space-y-2.5">
                {[
                  { step: "1", text: "Abre kravcoaching.com no Safari" },
                  { step: "2", text: "Toca no ícone ⎋ (barra inferior)" },
                  { step: "3", text: '"Adicionar ao ecrã de início"' },
                  { step: "4", text: 'Toca "Adicionar" — pronto! 🎉' },
                ].map((s) => (
                  <li key={s.step} className="flex items-start gap-3 text-xs text-zinc-400">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                    >
                      {s.step}
                    </span>
                    {s.text}
                  </li>
                ))}
              </ol>
            </div>

            {/* Android */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  🤖
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Android</p>
                  <p className="text-zinc-500 text-xs">Chrome</p>
                </div>
              </div>
              <ol className="space-y-2.5">
                {[
                  { step: "1", text: "Abre kravcoaching.com no Chrome" },
                  { step: "2", text: 'Toca nos "⋮" (canto superior direito)' },
                  { step: "3", text: '"Adicionar ao ecrã inicial"' },
                  { step: "4", text: 'Toca "Instalar" — pronto! 🎉' },
                ].map((s) => (
                  <li key={s.step} className="flex items-start gap-3 text-xs text-zinc-400">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                    >
                      {s.step}
                    </span>
                    {s.text}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className="text-center text-zinc-600 text-xs">
            💡 Depois de instalada, a app funciona offline e recebe notificações de treino.
          </p>
        </section>

        {/* ── PRICE ────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-16">
          <div
            className="rounded-3xl p-7 space-y-6"
            style={{
              background: "linear-gradient(160deg, rgba(201,168,76,0.10) 0%, rgba(10,10,12,0.95) 100%)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            {/* Price header */}
            <div className="text-center space-y-1">
              <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Plano Premium</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black text-white">€127</span>
                <span className="text-zinc-500 text-base">/mês</span>
              </div>
              <p className="text-zinc-500 text-sm">Tudo incluído. Sem surpresas.</p>
            </div>

            {/* Included list */}
            <ul className="space-y-2.5">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-black"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={signupUrl}
              className="block text-center w-full py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Aderir agora →
            </Link>
            <p className="text-center text-zinc-600 text-xs">
              Cancela a qualquer momento. Sem permanência.
            </p>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="max-w-2xl mx-auto px-5 pb-10 flex items-center justify-between text-xs text-zinc-700">
          <span className="font-black tracking-tighter text-base text-zinc-600">
            KRAV<span style={{ color: "#A8893A" }}>.</span>
          </span>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-zinc-400 transition-colors">Entrar</Link>
            <Link href={signupUrl} className="hover:text-zinc-400 transition-colors">Registar</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
