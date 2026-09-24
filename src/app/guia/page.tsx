import type { Metadata } from "next";
import Link from "next/link";
import GuiaForm from "./GuiaForm";
import type { Lang } from "@/lib/training/base-plan";

const META = {
  pt: {
    title: "Guia Grátis de Treino e Nutrição | KRAV Coach",
    description:
      "Guia grátis em PDF: como estruturar a tua semana de treino, quanto comer para o teu objetivo e os erros que travam o progresso. Versão para ginásio ou para treinar em casa.",
    locale: "pt_PT",
  },
  en: {
    title: "Free Training and Nutrition Guide | KRAV Coach",
    description:
      "Free PDF guide: how to structure your training week, how much to eat for your goal, and the mistakes that stall progress. Gym version or home version.",
    locale: "en_GB",
  },
} as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await searchParams;
  const lang: Lang = langParam === "en" ? "en" : "pt";
  const m = META[lang];

  return {
    title: m.title,
    description: m.description,
    keywords: [
      "guia treino grátis",
      "guia nutrição pdf",
      "plano treino grátis portugal",
      "plano de treino em casa",
      "free training guide",
    ],
    alternates: {
      canonical: lang === "en" ? "/guia?lang=en" : "/guia",
      languages: { "pt-PT": "/guia", en: "/guia?lang=en" },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: lang === "en" ? "/guia?lang=en" : "/guia",
      siteName: "KRAV Coach",
      locale: m.locale,
      type: "article",
    },
  };
}

/**
 * The lead magnet page.
 *
 * It used to be Portuguese only and to hand everyone the same gym plan. Both
 * were quietly costing leads: an English speaker reads a page in a language
 * they did not choose, and someone training at home reads a plan built around
 * machines they do not have.
 */

const T = {
  badge: { pt: "Download gratuito", en: "Free download" },
  headline1: { pt: "GUIA", en: "TRAINING" },
  headline2: { pt: "DE\nTREINO", en: "GUIDE" },
  sub: {
    pt: "O essencial para treinares certo, sem planos genéricos, sem perder tempo.",
    en: "What you need to train right, without generic plans and without wasting time.",
  },
} as const;

export default async function GuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang: Lang = langParam === "en" ? "en" : "pt";
  const other: Lang = lang === "en" ? "pt" : "en";

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#080808" }}>

      {/* ── Hero tipográfico ── */}
      <div
        className="relative w-full flex flex-col justify-end overflow-hidden"
        style={{ minHeight: 340, paddingBottom: 40 }}
      >
        {/* Fundo com glow dourado */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 80%, rgba(201,168,76,0.05) 0%, transparent 65%), #080808"
        }} />

        {/* Linhas decorativas */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute top-12 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)" }} />
          <div className="absolute top-0 bottom-0 left-8 w-px" style={{ background: "linear-gradient(180deg,transparent,rgba(201,168,76,0.05),transparent)" }} />
          <div className="absolute top-0 bottom-0 right-8 w-px" style={{ background: "linear-gradient(180deg,transparent,rgba(201,168,76,0.05),transparent)" }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{
            border: "1px solid rgba(201,168,76,0.05)",
          }} />
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full" style={{
            border: "1px solid rgba(201,168,76,0.05)",
          }} />
        </div>

        {/* Idioma: um link, para a página continuar a ser renderizada no servidor */}
        <Link
          href={`/guia?lang=${other}`}
          className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {other.toUpperCase()}
        </Link>

        {/* Conteúdo */}
        <div className="relative z-10 px-6 pt-14">
          <div className="mb-5">
            <span
              className="text-[10px] font-black tracking-[0.28em] uppercase px-3.5 py-1.5 rounded-full"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.28)",
                color: "#C9A84C",
              }}
            >
              {T.badge[lang]}
            </span>
          </div>

          <h1 className="font-black text-white leading-[0.92] tracking-tighter" style={{ fontSize: "clamp(3rem, 14vw, 5rem)" }}>
            {T.headline1[lang]}<br />
            <span style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 50%, #A8893A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              whiteSpace: "pre-line",
            }}>
              {T.headline2[lang]}
            </span>
          </h1>

          <div className="mt-5 mb-4 h-[2px] w-10 rounded-full" style={{ background: "linear-gradient(90deg,#E8C96B,#A8893A)" }} />

          <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px]">
            {T.sub[lang]}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24" style={{
          background: "linear-gradient(to top, #080808 40%, transparent)"
        }} />
      </div>

      {/* ── Form card ── */}
      <div className="flex flex-col items-center px-5 pb-14 -mt-2">
        <GuiaForm lang={lang} />
      </div>

    </main>
  );
}
