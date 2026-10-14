import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import { absoluteUrl } from "@/lib/seo";
import { ebookPrice } from "@/lib/ebook/price";
import { priceLabel } from "@/lib/billing/tiers";
import {
  COMMUNITY_URL, communityOpen, communityPlatform, COHORT_WEEKS,
  cohortState, cohortStartLabel, cohortName,
} from "@/lib/community";

/**
 * The community, and the group currently running the programme.
 *
 * This page exists so there is somewhere to send people that explains itself.
 * A bare channel invite in a bio gets ignored; a page that says what is inside,
 * when the next group starts and what it costs to join (nothing) does not. It
 * also works before the channel exists, which is what lets the card on /links
 * stop saying "em breve".
 */

export const metadata: Metadata = {
  title: "Comunidade KRAV | André Kravchuk",
  description:
    "O canal onde acompanho quem está a fazer o programa de 90 dias: correções, respostas e o que não vai para o Instagram. Grátis, e a próxima turma tem data.",
  alternates: { canonical: "/comunidade" },
  openGraph: {
    title: "Comunidade KRAV",
    description: "O canal de quem está a fazer os 90 dias. Grátis, com data de arranque.",
    url: absoluteUrl("/comunidade"),
    type: "website",
  },
};

const GOLD = "#C9A84C";

const T = {
  pt: {
    nav_app: "A app",
    eyebrow: "Comunidade · grátis",
    title: "O canal de quem está a treinar a sério",
    sub: "Um sítio só para quem quer fazer o trabalho. Aqui ponho o que não vai para o Instagram: correções, o que mudei no meu próprio treino essa semana, respostas a perguntas que aparecem muitas vezes, e o acompanhamento da turma que está a fazer os 90 dias.",
    inside_title: "O que ponho aqui e não ponho no Instagram",
    inside: [
      ["A turma, semana a semana", `Em que semana vamos, o que muda nessa semana, e o erro que quase todos cometem nela. Durante ${COHORT_WEEKS} semanas.`],
      ["Correções de execução", "Vídeos curtos dos erros que vejo nos clientes, sem filtro e sem edição para parecer bonito."],
      ["O meu próprio treino", "O que estou a fazer, com que cargas e o que ajustei. Um treinador que não treina não devia estar a dar conselhos."],
      ["Respostas diretas", "Mandas a pergunta, respondo no canal se servir a mais gente. Sem consultas pagas pelo meio."],
      ["Primeiro a saber", "Vagas de 1:1 que abrem, livros novos e descontos saem aqui antes de sair em qualquer outro lado."],
    ],
    cohort_eyebrow: "Próxima turma",
    cohort_title: (label: string) => `A turma começa a ${label}`,
    cohort_before: (days: number) =>
      days === 1
        ? "Falta 1 dia. Começamos todos na mesma segunda-feira, na semana 1, e vamos até ao fim."
        : `Faltam ${days} dias. Começamos todos na mesma segunda-feira, na semana 1, e vamos até ao fim.`,
    cohort_days: (days: number) => (days === 1 ? "1 dia" : `${days} dias`),
    cohort_days_label: "até ao arranque",
    cohort_running: (week: number) =>
      `A turma vai na semana ${week} de ${COHORT_WEEKS}. Podes entrar no canal e acompanhar, mas o teu programa começa na tua semana 1, não na nossa: ninguém entra a meio de um bloco.`,
    cohort_finished:
      "Esta turma já acabou as treze semanas. Entra no canal, que é lá que anuncio a data da próxima.",
    cohort_how_title: "Como entras na turma",
    cohort_how: [
      ["01", "Entra no canal", "É grátis e não precisas de comprar nada para acompanhar."],
      ["02", "Arranja o programa", `Pelo livro, €${ebookPrice()}, ou pela app, €${priceLabel("app")} por mês com 7 dias grátis. O programa é o mesmo nos dois: no livro lês, na app a semana aparece montada e os treinos ficam registados.`],
      ["03", `Começa a ${cohortStartLabel("pt")}`, "Todos na semana 1 ao mesmo tempo. É muito mais difícil desistir na semana 3 quando há gente a ir pela mesma semana."],
    ],
    join_title: "Entrar no canal",
    join_sub: {
      instagram: "Canal de difusão do Instagram. Não mostra o teu número nem o meu, e sais quando quiseres.",
      telegram: "Canal no Telegram. Não mostra o teu número nem o meu, e sais quando quiseres.",
      whatsapp: "Não mostra o teu número nem o meu, e sais quando quiseres.",
      other: "Não mostra o teu número nem o meu, e sais quando quiseres.",
    },
    join_cta: "Entrar no canal →",
    soon_title: "O canal abre em breve",
    soon_sub: "Deixa o email no guia grátis e eu aviso-te no dia em que abrir. É o mesmo email por onde te chega o plano de 5 dias.",
    soon_cta: "Quero o guia grátis →",
    doors_title: "E se quiseres o programa",
    door_book: (price: string) => `O livro, €${price}, pagamento único`,
    door_book_sub: "As treze semanas escritas ao pormenor, ginásio ou casa. Chega ao email em segundos.",
    door_app: (price: string) => `A app, €${price} por mês`,
    door_app_sub: "A mesma coisa, mas é a app a montar a semana e a registar os treinos. 7 dias grátis, sem cartão.",
    see: "Ver",
    privacy: "Não há grupo de WhatsApp de propósito: num grupo de WhatsApp todos veem o número de todos, o meu incluído.",
  },
  en: {
    nav_app: "The app",
    eyebrow: "Community · free",
    title: "The channel for people actually training",
    sub: "A place for people who want to do the work. This is where I put what does not go on Instagram: corrections, what I changed in my own training that week, answers to questions that keep coming up, and the group running the 90 days.",
    inside_title: "What goes here and not on Instagram",
    inside: [
      ["The group, week by week", `Which week we are on, what changes that week, and the mistake almost everybody makes in it. For ${COHORT_WEEKS} weeks.`],
      ["Form corrections", "Short videos of the mistakes I see in clients, unfiltered and unedited."],
      ["My own training", "What I am doing, at what weights, and what I adjusted. A coach who does not train should not be giving advice."],
      ["Straight answers", "Send the question, I answer in the channel if it helps more people. No paid call in between."],
      ["First to know", "1:1 places opening, new books and discounts go out here before anywhere else."],
    ],
    cohort_eyebrow: "Next group",
    cohort_title: (label: string) => `The group starts on ${label}`,
    cohort_before: (days: number) =>
      days === 1
        ? "1 day to go. We all start on the same Monday, on week 1, and we go to the end."
        : `${days} days to go. We all start on the same Monday, on week 1, and we go to the end.`,
    cohort_days: (days: number) => (days === 1 ? "1 day" : `${days} days`),
    cohort_days_label: "until we start",
    cohort_running: (week: number) =>
      `The group is on week ${week} of ${COHORT_WEEKS}. You can join the channel and follow along, but your programme starts on your week 1, not ours: nobody walks in halfway through a block.`,
    cohort_finished:
      "This group has finished its thirteen weeks. Join the channel, that is where the next date gets announced.",
    cohort_how_title: "How you join the group",
    cohort_how: [
      ["01", "Join the channel", "It is free and you do not have to buy anything to follow along."],
      ["02", "Get the programme", `Through the book, €${ebookPrice("en")}, or the app, €${priceLabel("app")} a month with 7 days free. The programme is the same in both: in the book you read it, in the app the week arrives built and every session is logged.`],
      ["03", `Start on ${cohortStartLabel("en")}`, "Everybody on week 1 at the same time. Quitting in week 3 is a lot harder when other people are on the same week."],
    ],
    join_title: "Join the channel",
    join_sub: {
      instagram: "An Instagram broadcast channel. It shows neither your phone number nor mine, and you can leave whenever you want.",
      telegram: "A Telegram channel. It shows neither your phone number nor mine, and you can leave whenever you want.",
      whatsapp: "It shows neither your phone number nor mine, and you can leave whenever you want.",
      other: "It shows neither your phone number nor mine, and you can leave whenever you want.",
    },
    join_cta: "Join the channel →",
    soon_title: "The channel opens shortly",
    soon_sub: "Leave your email on the free guide and I will tell you the day it opens. Same email that brings you the 5 day plan.",
    soon_cta: "I want the free guide →",
    doors_title: "And if you want the programme",
    door_book: (price: string) => `The book, €${price}, one payment`,
    door_book_sub: "The thirteen weeks written out in detail, gym or home. In your inbox in seconds.",
    door_app: (price: string) => `The app, €${price} a month`,
    door_app_sub: "The same thing, but the app builds the week and logs the sessions. 7 days free, no card.",
    see: "See",
    privacy: "There is deliberately no WhatsApp group: in a WhatsApp group everybody sees everybody's phone number, mine included.",
  },
} as const;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = langParam === "en" ? "en" : "pt";
  const isEN = lang === "en";
  const t = T[lang];
  const cohort = cohortState();
  const suffix = isEN ? "?lang=en" : "";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)" }}
      />
      <div className="relative z-10">
        {/* ── NAV ───────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
          <Link href={isEN ? "/?lang=en" : "/"} className="text-xl font-black tracking-tighter">
            KRAV<span style={{ color: GOLD }}>.</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <Link href="/comunidade" className={`px-3 py-1 text-xs font-bold ${!isEN ? "text-black" : "text-zinc-500"}`}
                style={!isEN ? { background: "linear-gradient(135deg,#E8C96B,#C9A84C)" } : undefined}>PT</Link>
              <Link href="/comunidade?lang=en" className={`px-3 py-1 text-xs font-bold ${isEN ? "text-black" : "text-zinc-500"}`}
                style={isEN ? { background: "linear-gradient(135deg,#E8C96B,#C9A84C)" } : undefined}>EN</Link>
            </div>
            <Link href={isEN ? "/?lang=en" : "/"} className="text-zinc-500 hover:text-white text-sm transition-colors">
              {t.nav_app}
            </Link>
          </div>
        </nav>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pt-10 pb-14 text-center">
          <ScrollReveal direction="up">
            <p className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: GOLD }}>{t.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl leading-[1.05]">{t.title}</h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 max-w-lg mx-auto">{t.sub}</p>

            {communityOpen ? (
              <a
                href={COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full sm:w-auto items-center justify-center px-10 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {t.join_cta}
              </a>
            ) : (
              <Link
                href={`/guia${suffix}`}
                className="mt-8 inline-flex w-full sm:w-auto items-center justify-center px-10 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {t.soon_cta}
              </Link>
            )}
            <p className="mt-3 text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
              {communityOpen ? t.join_sub[communityPlatform()] : t.soon_sub}
            </p>
          </ScrollReveal>
        </section>

        {/* ── THE GROUP ─────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-14">
          <ScrollReveal direction="up">
            <div className="rounded-3xl p-7"
              style={{
                background: "linear-gradient(160deg, rgba(201,168,76,0.12) 0%, rgba(10,10,12,0.95) 100%)",
                border: "1px solid rgba(201,168,76,0.3)",
              }}>
              <p className="text-[11px] font-black tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                {t.cohort_eyebrow}
              </p>

              {cohort.phase === "before" && (
                <>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">
                    {t.cohort_title(cohortStartLabel(lang))}
                  </h2>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="rounded-2xl px-5 py-3 text-center shrink-0"
                      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(201,168,76,0.3)" }}>
                      <p className="text-3xl font-black leading-none" style={{ color: GOLD }}>{cohort.daysUntil}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {t.cohort_days_label}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-400">{t.cohort_before(cohort.daysUntil)}</p>
                  </div>
                </>
              )}

              {cohort.phase === "running" && (
                <>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">{cohortName(lang)}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">{t.cohort_running(cohort.week)}</p>
                </>
              )}

              {cohort.phase === "finished" && (
                <>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">{cohortName(lang)}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">{t.cohort_finished}</p>
                </>
              )}

              {/* How you join, only while there is a start to aim at. */}
              {cohort.phase === "before" && (
                <div className="mt-7">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">{t.cohort_how_title}</h3>
                  <div className="mt-4 space-y-4">
                    {t.cohort_how.map(([n, title, body]) => (
                      <div key={n} className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}>
                          {n}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>

        {/* ── WHAT IS INSIDE ────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-14">
          <ScrollReveal direction="up">
            <h2 className="text-2xl font-black tracking-tight">{t.inside_title}</h2>
            <div className="mt-6 space-y-5">
              {t.inside.map(([title, body]) => (
                <div key={title}>
                  <h3 className="text-base font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 text-xs leading-relaxed text-zinc-600">{t.privacy}</p>
          </ScrollReveal>
        </section>

        {/* ── THE DOORS ─────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto px-5 pb-20">
          <ScrollReveal direction="up">
            <h2 className="text-2xl font-black tracking-tight">{t.doors_title}</h2>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="max-w-sm">
                  <p className="text-sm font-bold text-white">{t.door_book(ebookPrice(lang))}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t.door_book_sub}</p>
                </div>
                <Link href={`/ebook${suffix}`} className="text-sm font-bold shrink-0" style={{ color: GOLD }}>
                  {t.see} →
                </Link>
              </div>
              <div className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="max-w-sm">
                  <p className="text-sm font-bold text-white">{t.door_app(priceLabel("app"))}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t.door_app_sub}</p>
                </div>
                <Link href={`/start${suffix}`} className="text-sm font-bold shrink-0" style={{ color: GOLD }}>
                  {t.see} →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
}
