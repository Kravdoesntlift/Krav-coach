import { type Lang } from "@/lib/i18n";

/**
 * Says, in the open, that this week was generated rather than written by the
 * coach, and what a subscription changes.
 *
 * Leaving it unsaid would be the easier sell and the wrong one: the trial would
 * be passing off an automatic plan as personal coaching, and the person would
 * find out at exactly the wrong moment, which is the moment they are deciding
 * whether to pay for the real thing.
 */
export default function BasePlanNote({
  lang,
  daysPerWeek,
  equipmentLabel,
  isTrial,
}: {
  lang: Lang;
  daysPerWeek: number | null;
  equipmentLabel: string | null;
  /** Someone who already pays must never be sold what they have bought. */
  isTrial: boolean;
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
      <p className="text-zinc-500 text-xs leading-relaxed">
        {isTrial
          ? isEN
            ? "With a subscription, André reads what you logged and writes your plan himself, adjusting it every week."
            : "Com a subscrição, o André lê os teus registos e escreve o teu plano, e ajusta-o todas as semanas."
          : isEN
            ? "André is writing your own plan. Until it lands, train on this one: nothing you log here is lost."
            : "O André está a preparar o teu plano. Até chegar, treina por este: nada do que registares aqui se perde."}
      </p>
    </div>
  );
}
