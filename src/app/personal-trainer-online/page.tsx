import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import ScrollReveal from "@/components/ScrollReveal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

export const metadata: Metadata = {
  title: "Personal Trainer Online Portugal | KRAV Coach — Trial Grátis 7 Dias",
  description:
    "Personal trainer online com plano 100% personalizado, acompanhamento semanal e chat direto com o coach. Resultados reais — sem ginásio obrigatório. Trial grátis de 7 dias, sem cartão.",
  keywords: [
    "personal trainer online",
    "personal trainer online portugal",
    "coach fitness online",
    "coaching fitness personalizado",
    "treino personalizado online",
    "plano treino online",
    "coach treino portugal",
    "personal trainer lisboa",
    "coaching musculação online",
    "perder peso personal trainer",
    "ganhar massa muscular online",
  ],
  openGraph: {
    title: "Personal Trainer Online Portugal | KRAV Coach",
    description:
      "Plano personalizado, nutrição e coaching direto — tudo na app. Trial grátis de 7 dias.",
    url: "https://kravcoaching.com/personal-trainer-online",
    siteName: "KRAV Coach",
    locale: "pt_PT",
    type: "website",
  },
  alternates: {
    canonical: "https://kravcoaching.com/personal-trainer-online",
  },
};

const faqItems = [
  {
    q: "O que é um personal trainer online?",
    a: "É um coach que cria e ajusta o teu plano de treino e nutrição à distância — via app. Tens acompanhamento semanal, chat direto e feedback contínuo, sem precisar de marcar sessões presenciais.",
  },
  {
    q: "É realmente personalizado ou é um plano genérico?",
    a: "100% personalizado. Antes de criares a conta respondes a um questionário sobre os teus objetivos, nível, equipamento e dias disponíveis. O coach cria o plano com base nessas respostas — não é um template.",
  },
  {
    q: "Preciso de ginásio?",
    a: "Não. O plano adapta-se ao teu equipamento — ginásio completo, ginásio básico, treino em casa com pesos, ou apenas com o peso do corpo. Diz o que tens disponível e o coach cria o plano à medida.",
  },
  {
    q: "Quando recebo o meu plano?",
    a: "Nas primeiras 24 horas úteis após o registo. O coach recebe as tuas respostas de imediato e tem esse prazo para criar e enviar o plano na app.",
  },
  {
    q: "Quanto custa um personal trainer online?",
    a: "A KRAV Coach custa €127/mês com tudo incluído — plano de treino, nutrição, AI Coach 24/7, check-ins semanais e chat direto com o coach. Podes experimentar gratuitamente durante 7 dias, sem cartão de crédito.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem permanência, sem contratos. Cancelas a qualquer momento através da tua área de cliente. Sem perguntas.",
  },
  {
    q: "Funciona para iniciantes?",
    a: "Sim. O plano é adaptado ao teu nível — seja iniciante, intermédio ou avançado. Se nunca treinaste, o coach começa do zero contigo.",
  },
  {
    q: "Como é o acompanhamento semanal?",
    a: "Todas as semanas fazes um check-in na app (peso, energia, notas). O coach analisa e ajusta o plano se necessário. Se tiveres dúvidas, o chat está sempre disponível.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Personal Trainer Online — KRAV Coach",
  description:
    "Coaching fitness personalizado com plano de treino semanal, nutrição e acompanhamento real pelo coach.",
  provider: {
    "@type": "LocalBusiness",
    name: "KRAV Coach",
    url: "https://kravcoaching.com",
    address: { "@type": "PostalAddress", addressCountry: "PT" },
  },
  areaServed: { "@type": "Country", name: "Portugal" },
  offers: {
    "@type": "Offer",
    price: "127",
    priceCurrency: "EUR",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "127",
      priceCurrency: "EUR",
      unitText: "mês",
    },
    availability: "https://schema.org/InStock",
  },
};

const features = [
  { icon: "📋", title: "Plano 100% personalizado",  desc: "Criado pelo coach com base nos teus objetivos, nível e equipamento. Nunca um template genérico." },
  { icon: "📱", title: "App no teu telemóvel",      desc: "Instala como app, treina offline, recebe notificações. Funciona em iOS e Android." },
  { icon: "🤖", title: "AI Coach 24/7",             desc: "Assistente de IA personalizado ao teu plano. Tira dúvidas sobre treino, nutrição e recuperação a qualquer hora." },
  { icon: "🥗", title: "Nutrição & macros",         desc: "Base de dados portuguesa com milhares de alimentos. Calcula automaticamente calorias, proteína e hidratos." },
  { icon: "💬", title: "Chat direto com o coach",   desc: "Tira dúvidas, partilha resultados e mantém-te motivado em tempo real." },
  { icon: "📊", title: "Acompanhamento semanal",    desc: "Check-ins, feedback e ajustes contínuos ao plano conforme a tua evolução." },
  { icon: "🏆", title: "Registo de progresso",      desc: "Peso, medidas, recordes pessoais e conquistas. Compara fotos antes/depois com slider interativo." },
  { icon: "⚡", title: "Modo de treino ao vivo",    desc: "Timer de descanso com beep, registo de séries e pesos — tudo durante o treino." },
];

const steps = [
  { n: "1", title: "Inscreve-te",        desc: "Preenche o questionário em 2 minutos. O coach recebe as tuas respostas de imediato." },
  { n: "2", title: "Recebe o teu plano", desc: "Nas primeiras 24 horas úteis o coach cria e envia o teu plano personalizado na app." },
  { n: "3", title: "Treina com suporte", desc: "Segue o plano, regista os treinos e acompanha a tua evolução — o coach está sempre disponível." },
];

const included = [
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
];

export default async function PersonalTrainerOnlinePage() {
  const admin = createAdminClient();
  const { data: coach } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, bio, years_experience, credentials, transformation_before_url, transformation_after_url")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  const initials = coach?.full_name
    ? coach.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "K";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Ambient glow */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">

          {/* ── NAV ──────────────────────────────────────────────── */}
          <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
            <Link href="/" className="text-xl font-black tracking-tighter">
              KRAV<span style={{ color: "#C9A84C" }}>.</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/online-personal-trainer"
                className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                EN
              </Link>
              <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Entrar →
              </Link>
            </div>
          </nav>

          {/* ── HERO ─────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pt-10 pb-20 text-center">
            <ScrollReveal direction="up" delay={0}>
              <div className="space-y-7">
                {/* Badge */}
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
                      <span className="text-sm font-semibold" style={{ color: "#C9A84C" }}>{coach.full_name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "#C9A84C" }}>
                    Personal Trainer Online · Portugal
                  </p>
                  <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.03em] leading-[1.05]">
                    O teu treino.<br />
                    <span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Personalizado.
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg leading-relaxed max-w-sm mx-auto">
                    {coach?.tagline || "Coaching fitness premium com acompanhamento real — no teu telemóvel, 24/7."}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Link
                    href="/start"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110 w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    Trial grátis de 7 dias →
                  </Link>
                  <p className="text-zinc-500 text-xs">Depois €127/mês · Sem contratos</p>
                </div>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-zinc-500 text-sm border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
                >
                  Já tenho conta
                </Link>
              </div>
            </ScrollReveal>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)" }} />
          </div>

          {/* ── COACH BIO ────────────────────────────────────────── */}
          {coach && (coach.bio || (coach.credentials && coach.credentials.length > 0)) && (
            <section className="max-w-2xl mx-auto px-5 pb-16">
              <ScrollReveal direction="up">
                <div
                  className="rounded-3xl p-6 space-y-5"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {coach.avatar_url ? (
                      <Image
                        src={coach.avatar_url}
                        alt={coach.full_name}
                        width={64} height={64}
                        className="rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-black shrink-0"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base">{coach.full_name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Personal Trainer & Coach</p>
                      {coach.years_experience && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-black"
                          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
                          ★ {coach.years_experience}+ anos de experiência
                        </div>
                      )}
                    </div>
                  </div>

                  {coach.bio && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{coach.bio}</p>
                  )}

                  {coach.credentials && coach.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(coach.credentials as string[]).map((cr: string) => (
                        <span
                          key={cr}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300"
                          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
                        >
                          <span style={{ color: "#C9A84C" }}>✓</span>
                          {cr}
                        </span>
                      ))}
                    </div>
                  )}

                  {coach.transformation_before_url && coach.transformation_after_url && (
                    <div className="space-y-3 pt-2">
                      <p className="text-zinc-500 text-xs font-bold tracking-[0.15em] uppercase text-center">
                        A minha própria transformação
                      </p>
                      <BeforeAfterSlider
                        beforeUrl={coach.transformation_before_url}
                        afterUrl={coach.transformation_after_url}
                        beforeLabel="Antes"
                        afterLabel="Depois"
                        aspectRatio="4/5"
                      />
                      <p className="text-zinc-600 text-xs text-center">Arrasta o slider para comparar</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </section>
          )}

          {/* ── FEATURES ─────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                Tudo o que está incluído
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
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
                Como funciona
              </p>
            </ScrollReveal>
            <div className="space-y-3">
              {steps.map((s, i) => (
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

          {/* ── INSTALL PWA ──────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
            <ScrollReveal direction="up">
              <div className="space-y-2 text-center">
                <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase">
                  Instala a app no teu telemóvel
                </p>
                <p className="text-zinc-500 text-sm">Funciona como uma app nativa — sem precisar de ir à App Store.</p>
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
                      <p className="text-white font-bold text-sm">iPhone / iPad</p>
                      <p className="text-zinc-500 text-xs">Safari</p>
                    </div>
                  </div>
                  <ol className="space-y-2.5">
                    {[
                      "Abre kravcoaching.com no Safari",
                      "Toca no ícone ⎋ (barra inferior)",
                      '"Adicionar ao ecrã de início"',
                      'Toca "Adicionar" — pronto! 🎉',
                    ].map((text, i) => (
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
                      <p className="text-white font-bold text-sm">Android</p>
                      <p className="text-zinc-500 text-xs">Chrome</p>
                    </div>
                  </div>
                  <ol className="space-y-2.5">
                    {[
                      "Abre kravcoaching.com no Chrome",
                      'Toca nos "⋮" (canto superior direito)',
                      '"Adicionar ao ecrã inicial"',
                      'Toca "Instalar" — pronto! 🎉',
                    ].map((text, i) => (
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
              <p className="text-center text-zinc-600 text-xs">
                💡 Depois de instalada, a app funciona offline e recebe notificações de treino.
              </p>
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
                  <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Plano Premium</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-white">€127</span>
                    <span className="text-zinc-500 text-base">/mês</span>
                  </div>
                  <p className="text-zinc-500 text-sm">Tudo incluído. Sem surpresas.</p>
                </div>

                <ul className="space-y-2.5">
                  {included.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-black"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/start"
                  className="block text-center w-full py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  Aderir agora →
                </Link>

                {/* Guarantee badge */}
                <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-lg">🛡️</span>
                  <div className="text-left">
                    <p className="text-white text-xs font-bold">Garantia de 7 dias</p>
                    <p className="text-zinc-500 text-xs">Experimenta sem risco. Reembolso total se não ficares satisfeito.</p>
                  </div>
                </div>

                <p className="text-center text-zinc-600 text-xs">Cancela a qualquer momento. Sem permanência.</p>
              </div>
            </ScrollReveal>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── RESULT ───────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16 space-y-6">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                Resultado real
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <div
                className="rounded-3xl p-6 space-y-5"
                style={{
                  background: "linear-gradient(160deg, rgba(201,168,76,0.07) 0%, rgba(10,10,12,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-black" style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      +20kg
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">de massa muscular</p>
                  </div>
                  <div className="h-14 w-px shrink-0" style={{ background: "rgba(201,168,76,0.2)" }} />
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Cliente começou do zero e ganhou 20 kg de massa muscular com planos semanais personalizados, acompanhamento nutricional e coaching direto.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "💬 Suporte 24/7",
                    "🔒 Cancela quando quiseres",
                    "🎯 Plano em 24h",
                    "📱 App incluída",
                  ].map((badge, i) => (
                    <span
                      key={i}
                      className="text-zinc-500 text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
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
                Perguntas frequentes sobre personal trainer online
              </p>
            </ScrollReveal>

            <div className="space-y-2">
              {faqItems.map((item, i) => (
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
          <footer className="max-w-2xl mx-auto px-5 pb-10 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-black tracking-tighter text-base text-zinc-600">
              KRAV<span style={{ color: "#A8893A" }}>.</span>
            </span>
            <div className="flex gap-4">
              <Link href="/auth/login" className="hover:text-zinc-400 transition-colors">Entrar</Link>
              <Link href="/start" className="hover:text-zinc-400 transition-colors">Registar</Link>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
