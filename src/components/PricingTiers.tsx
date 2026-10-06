import Link from "next/link";
import { TIERS, priceLabel, type Tier } from "@/lib/billing/tiers";

/**
 * The price block for every public page.
 *
 * It used to be one card with one price, copied by hand into three landing
 * pages. When the App tier arrived the app started selling two things and the
 * site still sold one, which is the worst possible state: somebody reads 127,
 * decides it is too much and leaves, while the thing they would have paid for
 * exists. Everything here is read from `TIERS`, the same object the paywall and
 * the checkout use, so the site and the app cannot say different numbers again.
 */

const COPY = {
  pt: {
    eyebrow: "Planos",
    heading: "Duas formas de treinar com o método",
    sub: "Ambas começam com 7 dias grátis. Escolhes no fim, sem cartão à partida.",
    popular: "Mais escolhido",
    per: "/mês",
    cta_app: "Começar grátis →",
    cta_coaching: "Começar grátis →",
    guarantee: "Garantia de 7 dias",
    guarantee_sub: "Experimenta sem risco. Reembolso total se não ficares satisfeito.",
    note: "Cancela a qualquer momento. Sem permanência.",
  },
  en: {
    eyebrow: "Plans",
    heading: "Two ways to train with the method",
    sub: "Both start with 7 days free. You choose at the end, no card up front.",
    popular: "Most chosen",
    per: "/month",
    cta_app: "Start free →",
    cta_coaching: "Start free →",
    guarantee: "7-day guarantee",
    guarantee_sub: "Try it risk-free. Full refund if you are not satisfied.",
    note: "Cancel at any time. No commitment.",
  },
} as const;

function Card({
  tier,
  lang,
  href,
  highlight,
  spotsLeft,
}: {
  tier: Tier;
  lang: "pt" | "en";
  href: string;
  highlight: boolean;
  /** Real places left on 1:1, or null when there is no reason to say. */
  spotsLeft?: number | null;
}) {
  const info = TIERS[tier];
  const c = COPY[lang];

  return (
    <div
      className="relative rounded-3xl p-6 flex flex-col gap-5 h-full"
      style={
        highlight
          ? {
              background: "linear-gradient(160deg, rgba(201,168,76,0.12) 0%, rgba(10,10,12,0.95) 100%)",
              border: "1px solid rgba(201,168,76,0.3)",
            }
          : {
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.08)",
            }
      }
    >
      {highlight && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-[0.12em] uppercase text-black px-3 py-1 rounded-full whitespace-nowrap"
          style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}
        >
          {c.popular}
        </span>
      )}

      <div className="space-y-1.5 text-center pt-1">
        <p
          className="text-[11px] font-bold tracking-[0.16em] uppercase"
          style={{ color: highlight ? "#C9A84C" : "#71717a" }}
        >
          {info.name[lang]}
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-black text-white">€{priceLabel(tier)}</span>
          <span className="text-zinc-500 text-sm">{c.per}</span>
        </div>
        <p className="text-zinc-500 text-xs leading-relaxed px-2">{info.tagline[lang]}</p>
      </div>

      {typeof spotsLeft === "number" && (
        <p
          className="rounded-xl px-3 py-2 text-center text-[11px] font-bold leading-snug"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}
        >
          {spotsLeft === 0
            ? (lang === "en" ? "No places right now, the waiting list is open" : "Sem vagas neste momento, lista de espera aberta")
            : spotsLeft === 1
            ? (lang === "en" ? "1 place left" : "Resta 1 vaga")
            : (lang === "en" ? `${spotsLeft} places left` : `Restam ${spotsLeft} vagas`)}
        </p>
      )}

      <ul className="space-y-2.5">
        {info.includes[lang].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] text-zinc-300 leading-snug">
            <span
              className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-black"
              style={{
                background: highlight
                  ? "linear-gradient(135deg,#E8C96B,#A8893A)"
                  : "rgba(255,255,255,0.18)",
                color: highlight ? "#000" : "#e4e4e7",
              }}
            >
              ✓
            </span>
            {item}
          </li>
        ))}

        {/* Said out loud, on the public page and not only after payment. */}
        {info.excludes?.[lang].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] text-zinc-600 leading-snug">
            <span className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-white/[0.04] text-zinc-600">
              ✕
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">
        <Link
          href={href}
          className={`block text-center w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
            highlight ? "text-black hover:brightness-110" : "text-white hover:bg-white/[0.06]"
          }`}
          style={
            highlight
              ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }
          }
        >
          {highlight ? c.cta_coaching : c.cta_app}
        </Link>
      </div>
    </div>
  );
}

export default function PricingTiers({
  lang,
  signupHref = "/start",
  showHeading = true,
  spotsLeft = null,
}: {
  lang: "pt" | "en";
  /** Where both buttons go. The trial is the entry point for either tier. */
  signupHref?: string;
  showHeading?: boolean;
  /**
   * Places left on 1:1, counted from the live subscriptions. Null means there
   * is plenty of room, and the card says nothing rather than advertising it.
   */
  spotsLeft?: number | null;
}) {
  const c = COPY[lang];

  return (
    <div className="space-y-6">
      {showHeading && (
        <div className="text-center space-y-2">
          <p className="text-zinc-600 text-xs font-bold tracking-[0.18em] uppercase">{c.eyebrow}</p>
          <h2 className="text-2xl font-black text-white">{c.heading}</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">{c.sub}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        <Card tier="app" lang={lang} href={signupHref} highlight={false} />
        <Card tier="coaching" lang={lang} href={signupHref} highlight spotsLeft={spotsLeft} />
      </div>

      <div
        className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="text-lg">🛡️</span>
        <div className="text-left">
          <p className="text-white text-xs font-bold">{c.guarantee}</p>
          <p className="text-zinc-500 text-xs">{c.guarantee_sub}</p>
        </div>
      </div>

      <p className="text-center text-zinc-600 text-xs">{c.note}</p>
    </div>
  );
}
