/**
 * Client transformations shown on the landing page.
 *
 * These are the cards the coach already publishes in his Instagram highlights,
 * reused as they are: same photos, same numbers, same branding. Rebuilding
 * them natively would have meant cutting the before and after out of each
 * composite, and they are not cropped alike, so the seams would show.
 *
 * Every person here is real and named by the coach. All three were already
 * published with their names in his Instagram highlights, and on 2026-10-08
 * he confirmed that each of them agreed to appear on the site as well.
 *
 * Nothing invented, no stock photography, and no photo of the coach presented
 * as a client. Anything added here later needs the same: the person's own
 * numbers, and the person's permission.
 */

export interface Transformation {
  /** As written on the card itself. */
  name: string;
  /** File under public/transformacoes. */
  image: string;
  /** The headline number, exactly as the card states it. */
  result: { pt: string; en: string };
  /** One line, in the coach's voice. */
  note: { pt: string; en: string };
}

export const TRANSFORMATIONS: Transformation[] = [
  {
    name: "Guilherme",
    image: "guilherme.webp",
    result: { pt: "67kg → 87kg", en: "67kg → 87kg" },
    note: {
      pt: "Treinava há dois anos e tinha estagnado. Mais 20 quilos de massa com treino estruturado.",
      en: "He had trained for two years and stalled. Twenty kilos of mass with structured training.",
    },
  },
  {
    name: "Francisco",
    image: "francisco.webp",
    result: { pt: "110kg → 80kg", en: "110kg → 80kg" },
    note: {
      pt: "Menos 30 quilos, sem dietas milagrosas e sem atalhos.",
      en: "Thirty kilos down, with no miracle diets and no shortcuts.",
    },
  },
  {
    name: "Maxim Moisa",
    image: "maxim-moisa.webp",
    result: { pt: "73kg → 87kg", en: "73kg → 87kg" },
    note: {
      pt: "Mais 14 quilos de massa muscular. Treino estruturado, comida a sério, consistência.",
      en: "Fourteen kilos of muscle. Structured training, real food, consistency.",
    },
  },
];
