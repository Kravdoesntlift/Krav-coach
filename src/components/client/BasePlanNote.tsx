import Link from "next/link";
import { type Lang } from "@/lib/i18n";
import { priceLabel } from "@/lib/billing/tiers";

/**
 * Says, in the open, that this week was generated rather than written by the
 * coach, and what the next step is for the person reading it.
 *
 * The line at the bottom changes with what they pay, and that matters more
 * than it looks: telling somebody who already pays for the app tier to
 * "subscribe so André writes your plan" is selling them what they bought, and
 * telling a coaching client their plan is automatic would be a lie.
 */
export default function BasePlanNote({
  lang,
  daysPerWeek,
  equipmentLabel,
  mode,
  hasInjuries,
}: {
  lang: Lang;
  daysPerWeek: number | null;
  equipmentLabel: string | null;
  /** trial: still deciding. app: paying for this. coaching: waiting on André. */
  mode: "trial" | "app" | "coaching";
  /** They wrote something in the injuries box at signup. */
  hasInjuries: boolean;
}) {
  const isEN = lang === "en";

  const built = [
    daysPerWeek ? (isEN ? `${daysPerWeek} days a week` : `${daysPerWeek} dias por semana`) : null,
    equipmentLabel,
  ].filter(Boolean).join(" · ");

  return (
    <div
      className="rounded-2xl p-4 space-y-2"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black tracking-[0.14em] uppercase text-brand-gold">
          {isEN ? "Base plan" : "Plano base"}
        </span>
        {built && <span className="text-[11px] text-zinc-500">{built}</span>}
      </div>

      <p className="text-zinc-300 text-xs leading-relaxed">
        {isEN
          ? "Built automatically from your answers, following the KRAV method. Log every set: the app compares each week with the last one, which is where progress actually comes from."
          : "Montado automaticamente a partir das tuas respostas, com o método KRAV. Regista as séries: a app compara cada semana com a anterior, que é de onde vem o progresso."}
      </p>

      {hasInjuries && (
        // The generator does not know how to train around an injury, and
        // pretending otherwise is the one mistake here with a real cost.
        <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>
          {isEN
            ? "You mentioned an injury. Message me in the chat before the first session so we adjust it, and skip anything that hurts."
            : "Falaste numa lesão. Escreve-me no chat antes do primeiro treino para ajustarmos, e não faças nada que doa."}
        </p>
      )}

      {mode === "trial" && (
        <p className="text-zinc-500 text-xs leading-relaxed">
          {isEN
            ? `Keep this for €${priceLabel("app")} a month, or have André write your plan and adjust it weekly for €${priceLabel("coaching")}.`
            : `Podes ficar com isto por €${priceLabel("app")} por mês, ou ter o André a escrever o teu plano e a ajustá-lo todas as semanas por €${priceLabel("coaching")}.`}{" "}
          <Link href="/client/planos" className="text-brand-gold hover:underline">
            {isEN ? "See the plans" : "Ver os planos"}
          </Link>
        </p>
      )}

      {mode === "app" && (
        <p className="text-zinc-500 text-xs leading-relaxed">
          {isEN
            ? "Your plan is written by the app and refreshed every week, with a lighter week every fourth one. Want André writing it against what you logged?"
            : "O teu plano é montado pela app e renovado todas as semanas, com uma semana mais leve a cada quatro. Queres o André a escrevê-lo a partir do que registaste?"}{" "}
          <Link href="/client/planos" className="text-brand-gold hover:underline">
            {isEN ? "Move to 1:1" : "Passar para 1:1"}
          </Link>
        </p>
      )}

      {mode === "coaching" && (
        <p className="text-zinc-500 text-xs leading-relaxed">
          {isEN
            ? "André is writing your own plan. Until it lands, train on this one: nothing you log here is lost."
            : "O André está a preparar o teu plano. Até chegar, treina por este: nada do que registares aqui se perde."}
        </p>
      )}
    </div>
  );
}
