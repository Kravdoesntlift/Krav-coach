import type { Metadata } from "next";
import Link from "next/link";

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

const benefits = [
  {
    icon: "📋",
    title: "Plano 100% personalizado",
    desc: "Criado pelo coach com base nos teus objetivos, nível e equipamento. Nunca um template.",
  },
  {
    icon: "💬",
    title: "Chat direto com o coach",
    desc: "Tira dúvidas, partilha resultados e recebe feedback em tempo real — sem esperar semanas.",
  },
  {
    icon: "🤖",
    title: "AI Coach 24/7",
    desc: "Assistente de IA treinado no teu plano. Responde a qualquer hora sobre treino, nutrição e recuperação.",
  },
  {
    icon: "📊",
    title: "Acompanhamento semanal",
    desc: "Check-ins, análise de progresso e ajustes contínuos. O plano evolui contigo.",
  },
  {
    icon: "🥗",
    title: "Nutrição e macros",
    desc: "Base de dados portuguesa com milhares de alimentos. Calorias, proteína, hidratos — tudo calculado.",
  },
  {
    icon: "📱",
    title: "App no teu telemóvel",
    desc: "Instala como app nativa em iOS e Android. Treina offline, recebe notificações.",
  },
];

const steps = [
  {
    n: "1",
    title: "Inscreve-te em 2 minutos",
    desc: "Respondes ao questionário sobre objetivos, nível e equipamento. O coach recebe tudo de imediato.",
  },
  {
    n: "2",
    title: "Recebe o teu plano em 24h",
    desc: "O coach cria o plano personalizado e envia na app. Nutrição, treino e estratégia — tudo explicado.",
  },
  {
    n: "3",
    title: "Treina com suporte real",
    desc: "Segue o plano, regista os treinos, faz check-ins semanais. O coach está sempre disponível.",
  },
];

export default function PersonalTrainerOnlinePage() {
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

      <main className="bg-black text-white min-h-screen font-sans">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <Link href="/" className="font-black text-lg tracking-tight" style={{ color: "#C9A84C" }}>
            KRAV
          </Link>
          <Link
            href="/start"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Começar grátis →
          </Link>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-12 pb-16 max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
            Personal Trainer Online · Portugal
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
            O teu treino.<br />
            <span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Personalizado.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Plano de treino e nutrição criado pelo coach para ti — com acompanhamento semanal e chat direto.
            Sem ginásio obrigatório. Sem templates genéricos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/start"
              className="inline-block px-8 py-4 rounded-2xl font-bold text-black text-base"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Trial grátis de 7 dias →
            </Link>
            <Link
              href="/"
              className="inline-block px-8 py-4 rounded-2xl font-semibold text-white text-base"
              style={{ border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
            >
              Ver como funciona
            </Link>
          </div>
          <p className="text-zinc-600 text-sm mt-4">7 dias grátis · sem cartão de crédito · cancela quando quiseres</p>
        </section>

        {/* Result proof */}
        <section className="px-6 pb-16 max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <p className="text-5xl font-black mb-2" style={{ color: "#C9A84C" }}>+20 kg</p>
            <p className="text-white font-semibold text-lg mb-1">de massa muscular</p>
            <p className="text-zinc-400 text-sm">Cliente real · 18 meses de coaching online · sem esteroides</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">
            Tudo o que está incluído
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-2xl mb-3">{b.icon}</p>
                <p className="font-bold text-white mb-1">{b.title}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Como funciona</h2>
          <div className="flex flex-col gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-white mb-1">{s.title}</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Price */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-semibold">Plano Premium</p>
            <p className="text-5xl font-black text-white mb-1">€127<span className="text-2xl text-zinc-400 font-normal">/mês</span></p>
            <p className="text-zinc-500 text-sm mb-8">Tudo incluído. Sem surpresas.</p>
            <Link
              href="/start"
              className="inline-block w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-black text-base mb-3"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Começar trial grátis de 7 dias →
            </Link>
            <p className="text-zinc-600 text-sm">Cancela a qualquer momento. Sem permanência.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">
            Perguntas frequentes sobre personal trainer online
          </h2>
          <div className="flex flex-col gap-4">
            {faqItems.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="font-bold text-white mb-2">{q}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-24 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Pronto para começar?</h2>
          <p className="text-zinc-400 mb-8">7 dias grátis. Sem cartão de crédito. Cancelas quando quiseres.</p>
          <Link
            href="/start"
            className="inline-block px-10 py-4 rounded-2xl font-bold text-black text-base"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Começar trial grátis →
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-6 py-8 text-center text-zinc-600 text-xs">
          <Link href="/" className="font-black text-sm mr-6" style={{ color: "#C9A84C" }}>KRAV Coach</Link>
          <Link href="/start" className="mr-4 hover:text-white transition-colors">Registar</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Entrar</Link>
          <p className="mt-4">© {new Date().getFullYear()} KRAV Coach · Personal Trainer Online Portugal</p>
        </footer>
      </main>
    </>
  );
}
