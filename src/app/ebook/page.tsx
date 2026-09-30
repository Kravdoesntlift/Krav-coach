import type { Metadata } from "next";
import Link from "next/link";
import { ebookCopy, ebookPrice, EBOOK } from "@/lib/ebook/content";
import { buyEbookAction } from "./actions";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { priceLabel } from "@/lib/billing/tiers";
import ScrollReveal from "@/components/ScrollReveal";

/**
 * The sales page for the book.
 *
 * The only page on the site that asks for money without a trial, so it says
 * everything a buyer needs before paying: what is inside, who it is not for,
 * how it arrives, and what happens if it is not what they expected. A refund
 * promise costs a few euros a year and removes the only real objection at
 * thirteen euros.
 */

export const metadata: Metadata = {
  title: "90 Dias, o programa completo de treino | KRAV Coach",
  description:
    `Programa de treino de 13 semanas em PDF: três blocos, progressão semana a semana, versão de ginásio e de casa, nutrição e como medir o progresso. Entrega imediata por email, ${ebookPrice()} euros.`,
  alternates: { canonical: "/ebook" },
  openGraph: {
    title: "90 Dias, o programa completo de treino",
    description: `13 semanas, três blocos, ginásio ou casa. PDF entregue na hora por ${ebookPrice()} euros.`,
    url: absoluteUrl("/ebook"),
    type: "website",
  },
};

const GOLD = "#C9A84C";

const T = {
  pt: {
    nav_app: "A app",
    eyebrow: "Ebook · PDF",
    title: "90 Dias",
    sub: "O programa completo para construíres o teu primeiro físico estético. Treze semanas escritas ao pormenor, não três dicas.",
    cta: `Comprar por €${ebookPrice("pt")}`,
    cta_note: "Pagamento único. O link chega ao teu email em segundos.",
    pills: ["13 semanas", "Ginásio ou casa", "PT e EN"],
    problem_title: "O problema não é falta de informação",
    problem: [
      "Há vinte mil vídeos sobre como treinar peito. Não há um único que te diga o que fazer na semana 7 depois do que fizeste na semana 6.",
      "É aí que quase toda a gente para: não por falta de vontade, mas por não ter um plano que continue. Mudam de programa ao fim de três semanas, recomeçam do zero, e ao fim de um ano estão onde começaram.",
      "Este livro é o plano que continua. Treze semanas, três blocos, e uma regra clara de progressão para cada exercício, para nunca mais teres de decidir sozinho o que fazer a seguir.",
    ],
    inside_title: "O que está lá dentro",
    blocks_title: "Os três blocos",
    weeks_label: "semanas",
    forwho_title: "Para quem é, e para quem não é",
    author_title: "Quem escreveu isto",
    author: "Sou o André Kravchuk, Técnico Especialista em Exercício Físico e Técnico de Desporto. Acompanho clientes online e construí a app que eles usam. Este livro é o mesmo método que uso com eles, escrito para funcionar sem mim.",
    faq_title: "Perguntas antes de comprares",
    faq: [
      { q: "Como recebo o livro?", a: "Depois do pagamento aparece logo o link no ecrã, e chega também por email em segundos. É um documento que podes ler no telemóvel ou guardar em PDF." },
      { q: "Serve se treino em casa?", a: "Serve. O livro traz a versão de ginásio e um capítulo com a substituição exercício a exercício para halteres e barra de elevações, sem mudar as séries nem a progressão." },
      { q: "Já tenho o guia grátis. Isto é a mesma coisa?", a: "Não. O guia grátis são os princípios e uma semana de exemplo. Este é o programa completo: treze semanas, três blocos diferentes, regras de progressão, semana de teste, nutrição e como medir o progresso." },
      { q: "Preciso de conta na app?", a: "Não precisas de nada. Pagas, recebes o link, lês. A app é outra coisa e é opcional." },
      { q: "Sou principiante. É demasiado para mim?", a: "O primeiro bloco existe precisamente para quem está a começar, e diz-te com que peso começar. Se nunca treinaste, começa por aí e não saltes à frente." },
      { q: "E se não for o que eu esperava?", a: "Escreve-me nos primeiros 14 dias e devolvo o dinheiro, sem perguntas." },
    ],
    guarantee_title: "Garantia de 14 dias",
    guarantee: "Se o livro não te servir, escreve-me e devolvo o dinheiro. Prefiro isso a ter alguém a pagar por algo que não usa.",
    final_title: "Treze semanas, um plano, sem adivinhar",
    final_note: `Pagamento único de €${ebookPrice("pt")}. Sem subscrição.`,
    free_hint: "Ainda não me conheces? Começa pelo guia grátis.",
    free_cta: "Ver o guia grátis",
    app_hint: (app: string) => `Preferes que seja a app a montar e a renovar o teu treino todas as semanas? Isso é o plano App, €${app} por mês, com 7 dias grátis.`,
    app_cta: "Ver a app",
  },
  en: {
    nav_app: "The app",
    eyebrow: "Ebook · PDF",
    title: "90 Days",
    sub: "The complete programme for building your first aesthetic physique. Thirteen weeks written out in detail, not three tips.",
    cta: `Buy for €${ebookPrice("en")}`,
    cta_note: "One payment. The link reaches your inbox in seconds.",
    pills: ["13 weeks", "Gym or home", "PT and EN"],
    problem_title: "The problem is not a lack of information",
    problem: [
      "There are twenty thousand videos on how to train chest. There is not one that tells you what to do in week 7 given what you did in week 6.",
      "That is where almost everybody stops: not for lack of will, but for lack of a plan that continues. They switch programme after three weeks, start over, and a year later they are where they began.",
      "This book is the plan that continues. Thirteen weeks, three blocks, and a clear progression rule for every exercise, so you never have to decide what comes next on your own.",
    ],
    inside_title: "What is inside",
    blocks_title: "The three blocks",
    weeks_label: "weeks",
    forwho_title: "Who it is for, and who it is not for",
    author_title: "Who wrote this",
    author: "I am André Kravchuk, an exercise specialist and sports technician. I coach clients online and I built the app they use. This book is the same method I use with them, written to work without me.",
    faq_title: "Questions before you buy",
    faq: [
      { q: "How do I get the book?", a: "The link appears on screen right after payment and arrives by email within seconds. It is a document you can read on your phone or save as a PDF." },
      { q: "Does it work if I train at home?", a: "It does. The book carries the gym version plus a chapter swapping every exercise for dumbbell and pull-up bar versions, without changing the sets or the progression." },
      { q: "I already have the free guide. Is this the same?", a: "No. The free guide is the principles and one example week. This is the full programme: thirteen weeks, three different blocks, progression rules, a test week, nutrition and how to measure progress." },
      { q: "Do I need an account in the app?", a: "You need nothing. You pay, you get the link, you read. The app is a separate thing and it is optional." },
      { q: "I am a beginner. Is this too much?", a: "The first block exists precisely for people starting out, and it tells you what weight to start with. If you have never trained, start there and do not skip ahead." },
      { q: "What if it is not what I expected?", a: "Write to me within 14 days and I refund you, no questions." },
    ],
    guarantee_title: "14 day guarantee",
    guarantee: "If the book is not for you, write to me and I refund you. I would rather that than have somebody paying for something they do not use.",
    final_title: "Thirteen weeks, one plan, no guessing",
    final_note: `One payment of €${ebookPrice("en")}. No subscription.`,
    free_hint: "Do not know me yet? Start with the free guide.",
    free_cta: "See the free guide",
    app_hint: (app: string) => `Would you rather the app built and refreshed your training every week? That is the App plan, €${app} a month, with 7 days free.`,
    app_cta: "See the app",
  },
} as const;

export default async function EbookSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = langParam === "en" ? "en" : "pt";
  const isEN = lang === "en";
  const t = T[lang];
  const book = ebookCopy(lang);
  const price = ebookPrice(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${SITE_URL}/ebook#book`,
    name: `${book.title}, ${isEN ? "KRAV training programme" : "programa de treino KRAV"}`,
    bookFormat: "https://schema.org/EBook",
    numberOfPages: EBOOK.pages,
    inLanguage: isEN ? "en" : "pt-PT",
    author: { "@type": "Person", name: "André Kravchuk" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    description: book.subtitle,
    offers: {
      "@type": "Offer",
      price: (EBOOK.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      url: absoluteUrl("/ebook"),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          {/* ── NAV ─────────────────────────────────────────────── */}
          <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
            <Link href={isEN ? "/?lang=en" : "/"} className="text-xl font-black tracking-tighter">
              KRAV<span style={{ color: GOLD }}>.</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
                <Link href="/ebook" className={`px-3 py-1 text-xs font-bold ${!isEN ? "text-black" : "text-zinc-500"}`}
                  style={!isEN ? { background: "linear-gradient(135deg,#E8C96B,#C9A84C)" } : undefined}>PT</Link>
                <Link href="/ebook?lang=en" className={`px-3 py-1 text-xs font-bold ${isEN ? "text-black" : "text-zinc-500"}`}
                  style={isEN ? { background: "linear-gradient(135deg,#E8C96B,#C9A84C)" } : undefined}>EN</Link>
              </div>
              <Link href={isEN ? "/?lang=en" : "/"} className="text-zinc-500 hover:text-white text-sm transition-colors">
                {t.nav_app}
              </Link>
            </div>
          </nav>

          {/* ── HERO ────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pt-10 pb-16 text-center">
            <ScrollReveal direction="up">
              <p className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: GOLD }}>{t.eyebrow}</p>
              <h1 className="mt-4 text-6xl font-black tracking-tight sm:text-7xl">{t.title}</h1>
              <p className="mt-5 text-base leading-relaxed text-zinc-400 max-w-lg mx-auto">{t.sub}</p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                {t.pills.map((pill) => (
                  <span key={pill} className="rounded-full px-3 py-1.5 text-[11px] font-bold text-zinc-400"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {pill}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex items-baseline justify-center gap-2">
                <span className="text-4xl font-black text-white">€{price}</span>
                <span className="text-zinc-500 text-sm">PDF</span>
              </div>

              <form action={buyEbookAction} className="mt-5">
                <input type="hidden" name="lang" value={lang} />
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {t.cta}
                </button>
              </form>
              <p className="mt-3 text-xs text-zinc-600">{t.cta_note}</p>
            </ScrollReveal>
          </section>

          {/* ── PROBLEM ─────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-black tracking-tight">{t.problem_title}</h2>
              <div className="mt-4 space-y-3">
                {t.problem.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-zinc-400">{p}</p>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── CONTENTS ────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-black tracking-tight">{t.inside_title}</h2>
              <div className="mt-6 space-y-2.5">
                {book.contents.map((item, i) => (
                  <div key={item} className="flex items-start gap-4">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                      style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── BLOCKS ──────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-black tracking-tight">{t.blocks_title}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {book.phases.map((p) => (
                  <div key={p.n} className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-3xl font-black" style={{ color: "rgba(201,168,76,0.35)" }}>0{p.n}</p>
                    <h3 className="mt-2 text-base font-bold text-white">{p.name}</h3>
                    <p className="text-[11px] text-zinc-600">{p.weeks}</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">{p.aim}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── FOR WHO ─────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-black tracking-tight">{t.forwho_title}</h2>
              <div className="mt-6 space-y-5">
                {book.forWho.map((b) => (
                  <div key={b.title}>
                    <h3 className="text-base font-bold text-white">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{b.body}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── AUTHOR ──────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>{t.author_title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{t.author}</p>
              </div>
            </ScrollReveal>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-black tracking-tight">{t.faq_title}</h2>
              <div className="mt-6 space-y-2">
                {t.faq.map((f) => (
                  <details key={f.q} className="group rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-white text-sm font-semibold pr-4">{f.q}</span>
                      <span className="text-zinc-500 text-lg shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-zinc-400 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ── FINAL CTA ───────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16">
            <ScrollReveal direction="up">
              <div className="rounded-3xl p-7 text-center space-y-5"
                style={{
                  background: "linear-gradient(160deg, rgba(201,168,76,0.12) 0%, rgba(10,10,12,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}>
                <h2 className="text-2xl font-black tracking-tight">{t.final_title}</h2>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-black text-white">€{price}</span>
                  <span className="text-zinc-500 text-sm">PDF</span>
                </div>
                <form action={buyEbookAction}>
                  <input type="hidden" name="lang" value={lang} />
                  <button
                    type="submit"
                    className="block w-full py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    {t.cta}
                  </button>
                </form>
                <p className="text-xs text-zinc-600">{t.final_note}</p>

                <div className="flex items-start gap-2.5 py-3 px-4 rounded-2xl text-left"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-lg">🛡️</span>
                  <div>
                    <p className="text-white text-xs font-bold">{t.guarantee_title}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">{t.guarantee}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* ── OTHER WAYS IN ───────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-3">
            <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm text-zinc-400">{t.free_hint}</p>
              <Link href={isEN ? "/guia?lang=en" : "/guia"} className="text-sm font-bold" style={{ color: GOLD }}>
                {t.free_cta} →
              </Link>
            </div>
            <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm text-zinc-400 max-w-sm">{t.app_hint(priceLabel("app"))}</p>
              <Link href={isEN ? "/start?lang=en" : "/start"} className="text-sm font-bold" style={{ color: GOLD }}>
                {t.app_cta} →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
