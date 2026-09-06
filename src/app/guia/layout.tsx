import type { Metadata } from "next";

/**
 * The guide page is a client component, so it cannot export metadata itself.
 * Without this it was shipping with no title and no description at all -
 * crawlable, linked from robots.txt, and completely unpresentable in results.
 */
export const metadata: Metadata = {
  title: "Guia Grátis de Treino e Nutrição | KRAV Coach",
  description:
    "Guia grátis em PDF: como estruturar a tua semana de treino, quanto comer para o teu objetivo e os erros que travam o progresso. Escrito por um personal trainer, sem enrolação.",
  keywords: [
    "guia treino grátis",
    "guia nutrição pdf",
    "plano treino grátis portugal",
    "como estruturar treino semana",
    "quantas calorias para ganhar massa",
  ],
  alternates: { canonical: "/guia" },
  openGraph: {
    title: "Guia Grátis de Treino e Nutrição | KRAV Coach",
    description:
      "Como estruturar a tua semana de treino e quanto comer para o teu objetivo. PDF grátis.",
    url: "/guia",
    siteName: "KRAV Coach",
    locale: "pt_PT",
    type: "article",
  },
};

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
