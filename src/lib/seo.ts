/**
 * One source of truth for how this site presents itself to search engines and
 * to the AI crawlers that increasingly answer "recommend me a coach".
 *
 * Everything here used to be scattered as string literals across the layout,
 * the sitemap, robots.txt and three JSON-LD blocks: and they had drifted onto
 * two different hostnames. The apex redirects to www, so every URL we publish
 * must already be the www one: a canonical that points at a redirect splits the
 * ranking signals between two addresses for no reason.
 */

export const SITE_URL = "https://www.kravcoaching.com";

export const BRAND = {
  name: "KRAV Coach",
  legalName: "KRAV Coach",
  founder: "André Kravchuk",
  jobTitle: "Personal Trainer & Fitness Coach",
  // The address the Terms and Privacy pages already give clients. It must be a
  // mailbox that actually receives, since it is published in the site's
  // structured data and in llms.txt where an assistant may hand it to someone.
  email: "kravdoesntlift@gmail.com",
  priceEur: 127,
  currency: "EUR",
  areaServed: "PT",
  languages: ["pt-PT", "en"],
} as const;

/**
 * The verified Google Business Profile, addressed by its Knowledge Graph id
 * (/g/11nvv2h6db) rather than by the share link, which carries tracking
 * parameters and is not guaranteed to survive. Resolved from the profile's own
 * share URL, not guessed.
 */
export const GOOGLE_BUSINESS_URL = "https://www.google.com/search?kgmid=/g/11nvv2h6db";

/**
 * The direct "write a review" link for the Business Profile.
 *
 * Copied from the profile's own "Ask for reviews" button rather than
 * constructed, because a guessed review URL sends a willing client to an error
 * page, which is worse than not asking. Empty until it is pasted here, and the
 * prompt that uses it stays hidden while it is empty.
 */
export const GOOGLE_REVIEW_URL = "";

/** Profiles that prove this is one real business, not a parked domain. */
export const SOCIAL_PROFILES = [
  "https://www.instagram.com/kravdoesntlift",
  "https://www.tiktok.com/@kravdoesntlift",
  "https://www.youtube.com/@kravdoesntlift",
  GOOGLE_BUSINESS_URL,
];

export function absoluteUrl(path = "/"): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The sitewide entity. Search engines and answer engines resolve a brand to a
 * single node and hang everything else off it, so this is emitted once, on
 * every page, rather than being redefined per page.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    // "Krav" reads as Krav Maga to search engines, and Google's AI Overview for
    // "Krav coach" currently explains Israeli self-defence rather than this
    // business. disambiguatingDescription exists precisely to separate an entity
    // from a similarly named one, so it says plainly what this is and is not.
    alternateName: ["KRAV Coaching", "Krav Coach"],
    disambiguatingDescription:
      "KRAV Coach é um serviço de personal training online focado em musculação, hipertrofia, perda de gordura e treino de força. Não tem qualquer relação com Krav Maga nem com artes marciais ou defesa pessoal.",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
    },
    image: absoluteUrl("/api/og"),
    description:
      "Coaching de fitness online 1:1 em português: plano de treino semanal personalizado, acompanhamento nutricional e contacto direto com o coach através de app própria.",
    slogan: "Treino personalizado, acompanhamento a sério.",
    founder: {
      "@type": "Person",
      name: BRAND.founder,
      jobTitle: BRAND.jobTitle,
    },
    email: BRAND.email,
    priceRange: "€€",
    currenciesAccepted: BRAND.currency,
    areaServed: [
      { "@type": "Country", name: "Portugal" },
      // Mirrors the service areas declared on the Google Business Profile, so
      // the site and the listing describe the same reach.
      { "@type": "City", name: "Leiria" },
      { "@type": "City", name: "Caldas da Rainha" },
      { "@type": "City", name: "Lisboa" },
    ],
    availableLanguage: [
      { "@type": "Language", name: "Portuguese", alternateName: "pt" },
      { "@type": "Language", name: "English", alternateName: "en" },
    ],
    sameAs: SOCIAL_PROFILES,
    knowsAbout: [
      "Personal training online",
      "Hipertrofia e ganho de massa muscular",
      "Perda de gordura",
      "Periodização de treino de força",
      "Nutrição desportiva e contagem de macros",
    ],
    makesOffer: {
      "@type": "Offer",
      name: "Coaching Online 1:1",
      price: String(BRAND.priceEur),
      priceCurrency: BRAND.currency,
      url: absoluteUrl("/start"),
      availability: "https://schema.org/InStock",
      description: "Acompanhamento mensal com plano personalizado. Trial grátis de 7 dias, sem cartão.",
    },
  };
}

/**
 * Aggregate rating for the business, or null when there is not enough genuine
 * feedback to publish one.
 *
 * Deliberately gated. Google treats invented or thin review markup as spam and
 * it carries a manual-action risk, so this returns null until real clients have
 * actually left reviews: the markup switches itself on when the data earns it,
 * and never before.
 */
export const MIN_REVIEWS_FOR_AGGREGATE = 5;

export function aggregateRatingJsonLd(
  reviews: { rating: number | null }[],
): { "@type": "AggregateRating"; ratingValue: string; reviewCount: number; bestRating: string } | null {
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);
  if (rated.length < MIN_REVIEWS_FOR_AGGREGATE) return null;

  const avg = rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length;
  return {
    "@type": "AggregateRating",
    ratingValue: avg.toFixed(1),
    reviewCount: rated.length,
    bestRating: "5",
  };
}
