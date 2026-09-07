import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL, SOCIAL_PROFILES, BRAND } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sobre André Kravchuk | KRAV Coach",
  description:
    "Quem está por trás do KRAV Coach: formação, método de trabalho, como são construídos os planos e o que está incluído no acompanhamento.",
  alternates: { canonical: "/sobre" },
  openGraph: {
    title: "Sobre André Kravchuk | KRAV Coach",
    description: "Formação, método e o que está incluído no acompanhamento.",
    url: "/sobre",
    siteName: "KRAV Coach",
    locale: "pt_PT",
    type: "profile",
  },
};

export const revalidate = 3600;

export default async function Sobre() {
  const admin = createAdminClient();
  const { data: coach } = await admin
    .from("profiles")
    .select("full_name, avatar_url, bio, credentials, years_experience")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  const nome = coach?.full_name ?? BRAND.founder;
  const credenciais: string[] = Array.isArray(coach?.credentials) ? coach!.credentials : [];

  // The person behind the business, as its own entity. Search engines and
  // assistants resolve a coaching service through the coach, and until now the
  // site only ever described the company.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/sobre#person`,
    name: nome,
    jobTitle: BRAND.jobTitle,
    description: coach?.bio ?? undefined,
    url: `${SITE_URL}/sobre`,
    image: coach?.avatar_url ?? undefined,
    worksFor: { "@id": `${SITE_URL}/#organization` },
    knowsAbout: [
      "Treino de força",
      "Hipertrofia",
      "Perda de gordura",
      "Periodização",
      "Acompanhamento de macros",
    ],
    sameAs: SOCIAL_PROFILES,
  };

  const metodo = [
    {
      n: "01",
      t: "O plano parte das tuas respostas, não de um template",
      d: "Antes de começares respondes a um questionário sobre objetivo, experiência, equipamento disponível, lesões e os dias em que consegues mesmo treinar. O plano é construído a partir daí.",
    },
    {
      n: "02",
      t: "Registas o que fizeste, não o que estava previsto",
      d: "Cargas, séries, repetições e peso corporal ficam na app. É esse histórico que mostra se a progressão está a acontecer ou se está parada.",
    },
    {
      n: "03",
      t: "Reviso os teus registos todas as semanas",
      d: "Olho para o que subiu, o que estagnou e como te sentiste, e ajusto cargas, séries ou exercícios. Não é o mesmo plano repetido durante meses.",
    },
    {
      n: "04",
      t: "Falas comigo diretamente",
      d: "Chat dentro da app, sem intermediários. A ferramenta de IA responde a dúvidas rápidas a qualquer hora, mas quem decide o teu plano sou eu.",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <div className="min-h-screen bg-black text-white">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-5 pb-24">
          <nav className="flex items-center justify-between py-5">
            <Link href="/" className="text-xl font-black tracking-tighter">
              KRAV<span className="text-brand-gold">.</span>
            </Link>
            <Link href="/start" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Começar
            </Link>
          </nav>

          <header className="pt-10 pb-12">
            <p className="text-xs font-semibold tracking-[0.28em] uppercase text-brand-gold mb-5">
              Quem te vai acompanhar
            </p>
            <div className="flex items-center gap-5">
              {coach?.avatar_url && (
                <Image
                  src={coach.avatar_url}
                  alt={nome}
                  width={96}
                  height={96}
                  // The avatar is a dark crest, which disappears against a
                  // black page. A lifted panel behind it gives the mark an edge.
                  className="w-24 h-24 rounded-2xl object-contain shrink-0 border border-white/10 bg-zinc-900 p-2"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{nome}</h1>
                <p className="text-zinc-500 mt-1">{BRAND.jobTitle}</p>
              </div>
            </div>
            {coach?.bio && (
              <p className="text-zinc-300 leading-relaxed mt-8 text-[15px]">{coach.bio}</p>
            )}
          </header>

          {credenciais.length > 0 && (
            <section className="mb-14">
              <h2 className="text-xs font-semibold tracking-[0.24em] uppercase text-zinc-500 mb-4">
                Formação e experiência
              </h2>
              <ul className="space-y-2.5">
                {credenciais.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-[15px] text-zinc-300">
                    <span className="text-brand-gold mt-0.5 shrink-0">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-14">
            <h2 className="text-2xl font-black tracking-tight mb-2">Como trabalho</h2>
            <p className="text-zinc-500 text-sm mb-8">
              O que acontece depois de te inscreveres, por ordem.
            </p>
            <div className="space-y-5">
              {metodo.map((m) => (
                <div key={m.n} className="card p-5">
                  <div className="flex gap-4">
                    <span className="text-brand-gold font-black text-sm tabular-nums shrink-0 pt-0.5">
                      {m.n}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white leading-snug">{m.t}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mt-1.5">{m.d}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Saying plainly what this is not is worth more than another claim
              about what it is. It is also the honest answer to the question a
              careful person asks before paying for coaching. */}
          <section className="mb-14">
            <h2 className="text-2xl font-black tracking-tight mb-6">Para ser claro</h2>
            <div className="card-gold p-6 space-y-5 text-[15px] leading-relaxed">
              <div>
                <p className="font-bold text-white mb-1">Não sou nutricionista.</p>
                <p className="text-zinc-400">
                  O acompanhamento alimentar é registo e orientação de macros dentro da app. Planos
                  alimentares clínicos e dietas para condições médicas são competência de um
                  nutricionista inscrito na Ordem, e para isso encaminho-te.
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="font-bold text-white mb-1">A IA não decide o teu treino.</p>
                <p className="text-zinc-400">
                  Responde a dúvidas a qualquer hora e poupa-te tempo de espera. As alterações ao
                  plano passam por mim.
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="font-bold text-white mb-1">Não faço reabilitação de lesões.</p>
                <p className="text-zinc-400">
                  Adapto o treino a limitações que já conheças, mas uma lesão em tratamento é
                  acompanhada por fisioterapeuta ou médico.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-black tracking-tight mb-6">Perguntas diretas</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Quantos clientes acompanhas?",
                  a: "Trabalho com um número reduzido de clientes de propósito, para conseguir rever os registos de cada um todas as semanas. Se quiseres saber quantos são neste momento, pergunta-me no chat e digo-te.",
                },
                {
                  q: "Porquê 127 euros por mês?",
                  a: "Não estás a pagar uma biblioteca de treinos, que encontras de graça. Estás a pagar o tempo de alguém a olhar para os teus números todas as semanas e a decidir o que muda. É esse trabalho que custa, e é por isso que não posso ter clientes sem limite.",
                },
                {
                  q: "Posso experimentar antes de pagar?",
                  a: "Sete dias, sem cartão. Tempo suficiente para veres a qualidade do plano, a rapidez das respostas e se a app te serve. Não é tempo para veres resultados físicos, e não te vou dizer o contrário.",
                },
              ].map((f) => (
                <div key={f.q} className="card p-5">
                  <h3 className="font-bold text-white mb-2">{f.q}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="card-gold p-7 text-center">
            <p className="text-lg font-bold mb-1">Sete dias, sem cartão.</p>
            <p className="text-zinc-400 text-sm mb-6">
              Se não for para ti, sais sem pagar nada.
            </p>
            <Link href="/start" className="btn-primary inline-block px-8 py-3.5">
              Começar o trial
            </Link>
          </div>

          <p className="text-center text-zinc-600 text-xs mt-10">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Termos</Link>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
          </p>
        </div>
      </div>
    </>
  );
}
