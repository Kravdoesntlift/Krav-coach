import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";

// ─── Translations ─────────────────────────────────────────────────────────────
const t = {
  pt: {
    login:        "Entrar →",
    hero_title:   <>O teu treino.<br /><span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Personalizado.</span></>,
    hero_tagline: "Coaching fitness premium com acompanhamento real — no teu telemóvel, 24/7.",
    cta_primary:  "Começar agora — €127/mês",
    cta_login:    "Já tenho conta",
    no_contract:  "Sem contratos. Cancela quando quiseres.",
    section_features: "Tudo o que está incluído",
    section_how:  "Como funciona",
    section_install: "Instala a app no teu telemóvel",
    install_sub:  "Funciona como uma app nativa — sem precisar de ir à App Store.",
    install_hint: "💡 Depois de instalada, a app funciona offline e recebe notificações de treino.",
    ios_title:    "iPhone / iPad",
    ios_browser:  "Safari",
    ios_steps: [
      "Abre kravcoaching.com no Safari",
      "Toca no ícone ⎋ (barra inferior)",
      '"Adicionar ao ecrã de início"',
      'Toca "Adicionar" — pronto! 🎉',
    ],
    android_title:   "Android",
    android_browser: "Chrome",
    android_steps: [
      "Abre kravcoaching.com no Chrome",
      'Toca nos "⋮" (canto superior direito)',
      '"Adicionar ao ecrã inicial"',
      'Toca "Instalar" — pronto! 🎉',
    ],
    price_label:    "Plano Premium",
    price_sub:      "Tudo incluído. Sem surpresas.",
    price_cta:      "Aderir agora →",
    price_note:     "Cancela a qualquer momento. Sem permanência.",
    footer_login:   "Entrar",
    footer_signup:  "Registar",
    features: [
      { icon: "📋", title: "Plano 100% personalizado",  desc: "Criado pelo teu coach com base no teu nível, objetivos e equipamento disponível." },
      { icon: "📱", title: "App no teu telemóvel",      desc: "Instala como app, treina offline, recebe notificações. Funciona em iOS e Android." },
      { icon: "🤖", title: "AI Coach 24/7",             desc: "Assistente de IA personalizado ao teu plano. Tira dúvidas sobre treino, nutrição e recuperação a qualquer hora." },
      { icon: "🥗", title: "Nutrição & macros",         desc: "Base de dados com milhares de alimentos. Calcula automaticamente calorias, proteína, hidratos e micronutrientes." },
      { icon: "💬", title: "Chat direto com o coach",   desc: "Tira dúvidas, partilha resultados e mantém-te motivado em tempo real." },
      { icon: "📊", title: "Acompanhamento semanal",    desc: "Check-ins, feedback e ajustes contínuos ao plano conforme a tua evolução." },
      { icon: "🏆", title: "Registo de progresso",      desc: "Peso, medidas, recordes pessoais e conquistas. Compara fotos antes/depois com slider interativo." },
      { icon: "⚡", title: "Modo de treino ao vivo",    desc: "Timer de descanso com beep, registo de séries e pesos — tudo durante o treino." },
    ],
    steps: [
      { n: "1", title: "Inscreve-te",        desc: "Preenche o questionário em 2 minutos. O coach recebe as tuas respostas de imediato." },
      { n: "2", title: "Recebe o teu plano", desc: "Nas primeiras 24 horas úteis o coach cria e envia o teu plano personalizado na app." },
      { n: "3", title: "Treina com suporte", desc: "Segue o plano, regista os treinos e acompanha a tua evolução — o coach está sempre disponível." },
    ],
    included: [
      "Plano de treino semanal 100% personalizado",
      "Ajustes semanais ao plano",
      "Check-ins e análise de progresso",
      "Chat privado com o coach",
      "AI Coach disponível 24/7",
      "Rastreio de nutrição e macros (base de dados portuguesa)",
      "Registo de séries, pesos e medidas",
      "Fotos de progresso com comparação antes/depois",
      "Recordes pessoais e conquistas",
      "Relatório mensal em PDF",
      "Notificações e lembretes automáticos",
      "Acesso à app iOS e Android (PWA)",
    ],
    faq: [
      { q: "Quando recebo o meu plano?", a: "Nas primeiras 24 horas úteis após o registo, o coach cria e envia o teu plano personalizado diretamente na app." },
      { q: "É realmente personalizado?", a: "100%. O teu coach cria o plano com base nas tuas respostas: objetivos, nível, dias disponíveis e equipamento. Não é um template genérico." },
      { q: "Funciona para iniciantes?", a: "Sim. O plano é totalmente adaptado ao teu nível — seja iniciante, intermédio ou avançado." },
      { q: "Posso cancelar quando quiser?", a: "Sim. Sem permanência, sem contratos. Cancelas a qualquer momento através da tua área de cliente no Stripe." },
      { q: "E se não ficar satisfeito?", a: "Tens 7 dias para experimentar. Se não estiveres satisfeito, contacta o coach e reembolsamos sem perguntas." },
    ],
    guarantee: "Garantia de 7 dias",
    guarantee_sub: "Experimenta sem risco. Reembolso total se não ficares satisfeito.",
  },
  en: {
    login:        "Log in →",
    hero_title:   <>Your training.<br /><span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Personalised.</span></>,
    hero_tagline: "Premium fitness coaching with real accountability — on your phone, 24/7.",
    cta_primary:  "Get started — €127/month",
    cta_login:    "I already have an account",
    no_contract:  "No contracts. Cancel anytime.",
    section_features: "Everything that's included",
    section_how:  "How it works",
    section_install: "Install the app on your phone",
    install_sub:  "Works like a native app — no need to visit the App Store.",
    install_hint: "💡 Once installed, the app works offline and receives workout notifications.",
    ios_title:    "iPhone / iPad",
    ios_browser:  "Safari",
    ios_steps: [
      "Open kravcoaching.com in Safari",
      "Tap the ⎋ share icon (bottom bar)",
      '"Add to Home Screen"',
      'Tap "Add" — done! 🎉',
    ],
    android_title:   "Android",
    android_browser: "Chrome",
    android_steps: [
      "Open kravcoaching.com in Chrome",
      'Tap "⋮" (top right corner)',
      '"Add to Home Screen"',
      'Tap "Install" — done! 🎉',
    ],
    price_label:    "Premium Plan",
    price_sub:      "Everything included. No surprises.",
    price_cta:      "Join now →",
    price_note:     "Cancel at any time. No commitment.",
    footer_login:   "Log in",
    footer_signup:  "Sign up",
    features: [
      { icon: "📋", title: "100% personalised plan",    desc: "Created by your coach based on your level, goals and available equipment." },
      { icon: "📱", title: "App on your phone",         desc: "Install as an app, train offline, receive notifications. Works on iOS and Android." },
      { icon: "🤖", title: "AI Coach 24/7",             desc: "AI assistant personalised to your plan. Ask anything about training, nutrition and recovery at any time." },
      { icon: "🥗", title: "Nutrition & macros",        desc: "Database of thousands of foods. Automatically calculates calories, protein, carbs and micronutrients." },
      { icon: "💬", title: "Direct chat with your coach", desc: "Ask questions, share results and stay motivated in real time." },
      { icon: "📊", title: "Weekly check-ins",          desc: "Check-ins, feedback and continuous plan adjustments as you progress." },
      { icon: "🏆", title: "Progress tracking",         desc: "Weight, measurements, personal records and achievements. Compare before/after photos with an interactive slider." },
      { icon: "⚡", title: "Live workout mode",         desc: "Rest timer with audio cue, set and weight tracking — all during your workout." },
    ],
    steps: [
      { n: "1", title: "Sign up",           desc: "Fill in the questionnaire in 2 minutes. Your coach receives your answers immediately." },
      { n: "2", title: "Get your plan",     desc: "Within 24 working hours your coach creates and sends your personalised plan in the app." },
      { n: "3", title: "Train with support", desc: "Follow the plan, log your workouts and track your progress — your coach is always available." },
    ],
    included: [
      "100% personalised weekly training plan",
      "Weekly plan adjustments",
      "Check-ins and progress analysis",
      "Private chat with your coach",
      "AI Coach available 24/7",
      "Nutrition & macro tracking (Portuguese food database)",
      "Sets, weights and measurements log",
      "Progress photos with before/after slider",
      "Personal records and achievements",
      "Monthly progress report (PDF)",
      "Automated notifications and reminders",
      "Access to the iOS and Android app (PWA)",
    ],
    faq: [
      { q: "When do I get my plan?", a: "Within 24 working hours of signing up, your coach creates and sends your personalised plan directly in the app." },
      { q: "Is it really personalised?", a: "100%. Your coach builds the plan based on your answers: goals, level, available days and equipment. Not a generic template." },
      { q: "Does it work for beginners?", a: "Yes. The plan is fully adapted to your current level — beginner, intermediate or advanced." },
      { q: "Can I cancel anytime?", a: "Yes. No commitment, no contracts. Cancel anytime through your Stripe customer portal." },
      { q: "What if I'm not satisfied?", a: "You have 7 days to try it out. If you're not happy, contact your coach and we'll refund you, no questions asked." },
    ],
    guarantee: "7-day guarantee",
    guarantee_sub: "Try it risk-free. Full refund if you're not satisfied.",
  },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  // Se já tem sessão, vai direto para o dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "coach") redirect("/coach/dashboard");
    else redirect("/client/dashboard");
  }

  const { lang } = await searchParams;
  const isEN = lang === "en";
  const c = isEN ? t.en : t.pt;

  const admin = createAdminClient();
  const { data: coach } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, tagline_en")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  // Self-service funnel — always /start (quiz + stripe)
  const signupUrl = "/start";
  const signupUrlWithLang = signupUrl;
  const initials = coach?.full_name
    ? coach.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "K";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%)" }}
      />

      <div className="relative z-10">

        {/* ── NAV ──────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
          <span className="text-xl font-black tracking-tighter">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            {isEN ? (
              <Link
                href="/"
                className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                PT
              </Link>
            ) : (
              <Link
                href="/?lang=en"
                className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                EN
              </Link>
            )}
            <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              {c.login}
            </Link>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pt-10 pb-20 text-center">
          <ScrollReveal direction="up" delay={0}>
            <div className="space-y-7">
              {/* Coach badge */}
              {coach && (
                <div>
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
                    style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                    {coach.avatar_url ? (
                      <Image src={coach.avatar_url} alt={coach.full_name} width={28} height={28} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
                        {initials}
                      </div>
                    )}
                    <span className="text-brand-gold text-sm font-semibold">{coach.full_name}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.03em] leading-[1.05]">
                  {c.hero_title}
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-sm mx-auto">
                  {isEN
                    ? (coach?.tagline_en || c.hero_tagline)
                    : (coach?.tagline    || c.hero_tagline)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={signupUrlWithLang}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {c.cta_primary}
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-zinc-400 text-base border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
                >
                  {c.cta_login}
                </Link>
              </div>

              <p className="text-zinc-600 text-xs">{c.no_contract}</p>
            </div>
          </ScrollReveal>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)" }} />
        </div>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
          <ScrollReveal direction="up">
            <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
              {c.section_features}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.features.map((f, i) => (
              <ScrollReveal key={f.title} direction="up" delay={Math.floor(i / 2) * 100}>
                <div
                  className="rounded-2xl p-5 space-y-2 h-full"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="text-2xl">{f.icon}</div>
                  <p className="text-white font-bold text-sm">{f.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
          <ScrollReveal direction="up">
            <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
              {c.section_how}
            </p>
          </ScrollReveal>
          <div className="space-y-3">
            {c.steps.map((s, i) => (
              <ScrollReveal key={s.n} direction="up" delay={i * 90}>
                <div
                  className="flex items-start gap-4 p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
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
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* ── INSTALL ──────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
          <ScrollReveal direction="up">
            <div className="space-y-2 text-center">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase">
                {c.section_install}
              </p>
              <p className="text-zinc-500 text-sm">{c.install_sub}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={80}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* iOS */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>🍎</div>
                  <div>
                    <p className="text-white font-bold text-sm">{c.ios_title}</p>
                    <p className="text-zinc-500 text-xs">{c.ios_browser}</p>
                  </div>
                </div>
                <ol className="space-y-2.5">
                  {c.ios_steps.map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-zinc-400">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>{i + 1}</span>
                      {text}
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>🤖</div>
                  <div>
                    <p className="text-white font-bold text-sm">{c.android_title}</p>
                    <p className="text-zinc-500 text-xs">{c.android_browser}</p>
                  </div>
                </div>
                <ol className="space-y-2.5">
                  {c.android_steps.map((text, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-zinc-400">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>{i + 1}</span>
                      {text}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="none" delay={160}>
            <p className="text-center text-zinc-600 text-xs">{c.install_hint}</p>
          </ScrollReveal>
        </section>

        {/* ── PRICE ────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20">
          <ScrollReveal direction="up">
            <div
              className="rounded-3xl p-7 space-y-6"
              style={{
                background: "linear-gradient(160deg, rgba(201,168,76,0.10) 0%, rgba(10,10,12,0.95) 100%)",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <div className="text-center space-y-1">
                <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">{c.price_label}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-white">€127</span>
                  <span className="text-zinc-500 text-base">{isEN ? "/month" : "/mês"}</span>
                </div>
                <p className="text-zinc-500 text-sm">{c.price_sub}</p>
              </div>

              <ul className="space-y-2.5">
                {c.included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-black"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={signupUrlWithLang}
                className="block text-center w-full py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {c.price_cta}
              </Link>

              {/* Guarantee badge */}
              <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-lg">🛡️</span>
                <div className="text-left">
                  <p className="text-white text-xs font-bold">{c.guarantee}</p>
                  <p className="text-zinc-500 text-xs">{c.guarantee_sub}</p>
                </div>
              </div>

              <p className="text-center text-zinc-600 text-xs">{c.price_note}</p>
            </div>
          </ScrollReveal>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20 space-y-4">
          <ScrollReveal direction="up">
            <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
              {isEN ? "Frequently asked questions" : "Perguntas frequentes"}
            </p>
          </ScrollReveal>

          <div className="space-y-2">
            {c.faq.map((item, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 60}>
                <details className="group rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                    <span className="text-white text-sm font-semibold pr-4">{item.q}</span>
                    <span className="text-zinc-500 text-lg shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-5 pb-6">
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer className="max-w-2xl mx-auto px-5 pb-10 flex items-center justify-between text-xs text-zinc-700">
          <span className="font-black tracking-tighter text-base text-zinc-600">
            KRAV<span style={{ color: "#A8893A" }}>.</span>
          </span>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-zinc-400 transition-colors">{c.footer_login}</Link>
            <Link href={signupUrlWithLang} className="hover:text-zinc-400 transition-colors">{c.footer_signup}</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
