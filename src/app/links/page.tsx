import type { Metadata } from "next";
import LinksBoard, { type CommunityCopy } from "@/components/links/LinksBoard";
import { absoluteUrl } from "@/lib/seo";
import { communityOpen, cohortState, cohortStartLabel, COHORT_WEEKS } from "@/lib/community";

/**
 * The bio link, for Instagram, TikTok and YouTube.
 *
 * A server wrapper around the board for one reason: the community card counts
 * down to the day the group starts, and a count worked out in the browser
 * would disagree with the prerendered HTML, while one worked out at build time
 * would still say "17 days" in December. Rebuilt at most once an hour, which
 * is close enough for a number measured in days and far cheaper than
 * rendering the page for every visitor arriving from a story.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "André Kravchuk · tudo num só sítio",
  description:
    "O guia de treino grátis, o livro 90 Dias, a app KRAV e o coaching 1:1. Mais a comunidade e as redes, tudo a partir daqui.",
  alternates: { canonical: "/links" },
  openGraph: {
    title: "André Kravchuk · KRAV",
    description: "Guia grátis, livro 90 Dias, a app e o coaching 1:1.",
    url: absoluteUrl("/links"),
    type: "website",
  },
};

function communityCopy(): CommunityCopy {
  const cohort = cohortState();
  const cta = communityOpen ? "Entrar" : "Ver";

  if (cohort.phase === "before") {
    const days = cohort.daysUntil === 1 ? "Falta 1 dia" : `Faltam ${cohort.daysUntil} dias`;
    return {
      badge: "✓ GRÁTIS · TURMA NOVA",
      title: `A turma começa a ${cohortStartLabel("pt")}`,
      sub: `${days} · começamos todos na semana 1`,
      cta,
    };
  }

  if (cohort.phase === "running") {
    return {
      badge: "✓ GRÁTIS · A DECORRER",
      title: `A turma vai na semana ${cohort.week}`,
      sub: `Semana ${cohort.week} de ${COHORT_WEEKS} · acompanha no canal`,
      cta,
    };
  }

  return {
    badge: "✓ GRÁTIS",
    title: "A comunidade KRAV",
    sub: "O canal onde sai a data da próxima turma",
    cta,
  };
}

export default function LinksPage() {
  return <LinksBoard community={communityCopy()} />;
}
