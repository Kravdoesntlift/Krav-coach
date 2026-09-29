import { PaywallSubscribeButton } from "@/components/client/PaywallSubscribeButton";
import { subscribeAction } from "@/app/client/subscribe-action";
import { TIERS, priceLabel, type Tier } from "@/lib/billing/tiers";
import type { Lang } from "@/lib/training/base-plan";

/**
 * The two plans, side by side, with what each one is not.
 *
 * Both cards exist so that 127 euros has something to be compared against.
 * Until now anyone who could not pay it simply hit a wall at the end of the
 * trial and left, and the app had no way to keep them.
 */

const COPY = {
  perMonth: { pt: "/mês", en: "/month" },
  choose: { pt: "Escolher", en: "Choose" },
  redirecting: { pt: "A ir para o pagamento...", en: "Going to payment..." },
  recommended: { pt: "Mais escolhido", en: "Most chosen" },
  cancel: {
    pt: "Sem fidelização. Cancelas quando quiseres.",
    en: "No lock-in. Cancel whenever you want.",
  },
  upgradeNote: {
    pt: "Podes começar na App e passar para 1:1 quando quiseres.",
    en: "You can start on App and move to 1:1 whenever you want.",
  },
} as const;

function TierCard({ tier, lang, highlight }: { tier: Tier; lang: Lang; highlight: boolean }) {
  const info = TIERS[tier];

  return (
    <div
      className="rounded-2xl p-5 text-left flex flex-col gap-4"
      style={
        highlight
          ? { background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.32)" }
          : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }
      }
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-black uppercase tracking-[0.14em] ${highlight ? "text-brand-gold" : "text-zinc-400"}`}>
            {info.name[lang]}
          </span>
          {highlight && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(201,168,76,0.16)", color: "#C9A84C" }}
            >
              {COPY.recommended[lang]}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white">€{priceLabel(tier)}</span>
          <span className="text-zinc-500 text-sm">{COPY.perMonth[lang]}</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">{info.tagline[lang]}</p>
      </div>

      <ul className="space-y-2">
        {info.includes[lang].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
            <span className="mt-0.5 shrink-0 font-bold" style={{ color: highlight ? "#C9A84C" : "#71717a" }}>✓</span>
            {item}
          </li>
        ))}
        {/* What it is not. Saying this here costs a few sign-ups and saves
            every refund conversation that starts with "eu pensei que". */}
        {info.excludes?.[lang].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-600">
            <span className="mt-0.5 shrink-0">✕</span>
            {item}
          </li>
        ))}
      </ul>

      <form action={subscribeAction} className="mt-auto">
        <input type="hidden" name="tier" value={tier} />
        <PaywallSubscribeButton
          label={`${COPY.choose[lang]} ${info.name[lang]} →`}
          pendingLabel={COPY.redirecting[lang]}
          variant={highlight ? "primary" : "secondary"}
        />
      </form>
    </div>
  );
}

export default function TierChooser({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TierCard tier="app" lang={lang} highlight={false} />
        <TierCard tier="coaching" lang={lang} highlight />
      </div>
      <p className="text-center text-[11px] text-zinc-600">
        {COPY.cancel[lang]} {COPY.upgradeNote[lang]}
      </p>
    </div>
  );
}
