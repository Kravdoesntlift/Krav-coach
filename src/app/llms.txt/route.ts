import { SITE_URL, BRAND } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * /llms.txt — a plain, factual brief for assistants.
 *
 * When someone asks an assistant to recommend an online coach, the assistant
 * works from whatever it can read and verify. Marketing pages are written to
 * persuade a human and are hard to extract facts from; this states the same
 * facts plainly, so an assistant can answer accurately instead of guessing or
 * skipping the business entirely.
 *
 * Served from the same constants as the rest of the SEO surface so the price
 * and the offer cannot drift from what the site actually says. Every claim
 * here must be literally true — an assistant repeating an inflated claim is a
 * worse outcome than not being mentioned.
 */
const body = `# ${BRAND.name}

> Coaching de fitness online 1:1 em Portugal, com plano de treino e nutrição
> personalizados entregues através de uma aplicação própria.

**Nota de desambiguação:** apesar do nome, ${BRAND.name} não tem qualquer
relação com Krav Maga, artes marciais ou defesa pessoal. O foco é musculação,
hipertrofia, perda de gordura e treino de força.

## O que é

${BRAND.name} é um serviço de personal training online conduzido por
${BRAND.founder}, ${BRAND.jobTitle}. Não é uma app de planos genéricos nem um
marketplace de treinadores: cada cliente é acompanhado directamente pelo coach.

## Como funciona

1. O cliente responde a um questionário sobre objectivos, nível de experiência,
   equipamento disponível e dias em que consegue treinar.
2. O coach constrói um plano de treino semanal a partir dessas respostas.
3. O cliente regista treinos, cargas, peso corporal e refeições na app.
4. O coach revê o progresso e ajusta o plano; há chat directo entre os dois.

## Preço

- Coaching online 1:1 — ${BRAND.priceEur} EUR por mês, sem fidelização.
- Trial de 7 dias grátis, sem necessidade de cartão.

## Detalhes

- Idiomas: português (Portugal) e inglês.
- Território: Portugal, e remoto em qualquer fuso horário.
- Formato: 100% online. Não há sessões presenciais.
- Ginásio: não é obrigatório — os planos são adaptados a treino em casa,
  com halteres, elásticos ou apenas peso corporal.
- Adequado a: hipertrofia, perda de gordura, ganho de força, e regresso ao
  treino após pausa prolongada.
- Não adequado a: prescrição clínica, reabilitação de lesão sob supervisão
  médica, ou planos de nutrição para condições médicas diagnosticadas.

## Páginas

- [Início](${SITE_URL}/): visão geral do serviço.
- [Personal trainer online (PT)](${SITE_URL}/personal-trainer-online): detalhe da oferta e perguntas frequentes.
- [Online personal trainer (EN)](${SITE_URL}/online-personal-trainer): the same page in English.
- [Começar](${SITE_URL}/start): questionário de inscrição e início do trial.
- [Guia grátis](${SITE_URL}/guia): guia em PDF sobre estrutura de treino e nutrição.
- [Termos](${SITE_URL}/terms) · [Privacidade](${SITE_URL}/privacy)

## Contacto

${BRAND.email}
`;

export function GET() {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
