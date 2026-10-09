import { PROGRAM_90_WEEKS, program90Structure, type Program90State } from "@/lib/training/program90";
import { StartProgram90Button } from "./StartProgram90Button";
import { startProgram90Action } from "@/app/client/program-action";
import type { Lang } from "@/lib/training/base-plan";

/**
 * The book, running inside the app.
 *
 * Somebody who bought "90 Dias" otherwise follows it by scrolling a PDF and
 * remembering which week they were on. Here the app writes the week, the
 * session opens with the right exercises, and every set is compared with the
 * last one. Offered to anyone whose plan the app writes, because the book now
 * comes with every subscription anyway.
 */
export default function Program90Card({
  lang,
  state,
}: {
  lang: Lang;
  state: Program90State;
}) {
  const isEN = lang === "en";

  if (!state.enrolled || state.finished) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black tracking-[0.14em] uppercase text-brand-gold">
            {isEN ? "90 Days programme" : "Programa 90 Dias"}
          </p>
          <p className="text-zinc-300 text-xs leading-relaxed">
            {state.finished
              ? (isEN
                ? "You finished the thirteen weeks. Run them again with the weights you finished on: that is how people keep progressing for years."
                : "Acabaste as treze semanas. Repete-as com os pesos com que acabaste: é assim que se progride durante anos.")
              : (isEN
                ? "Thirteen weeks in three blocks, with a lighter week every fourth one and a test week at the end. The app writes each week for your days and your equipment, instead of you scrolling a PDF to find where you stopped."
                : "Treze semanas em três blocos, com uma semana mais leve a cada quatro e uma semana de teste no fim. A app escreve cada semana para os teus dias e o teu material, em vez de andares a procurar num PDF onde ficaste.")}
          </p>
        </div>
        <form action={startProgram90Action}>
          <StartProgram90Button
            label={state.finished
              ? (isEN ? "Run it again" : "Fazer outra vez")
              : (isEN ? "Follow the 90 Days in the app" : "Seguir os 90 Dias na app")}
            pendingLabel={isEN ? "Writing your weeks..." : "A escrever as tuas semanas..."}
          />
        </form>
      </div>
    );
  }

  // Enrolled, but the first Monday has not arrived yet.
  if (state.currentWeek === null) {
    return (
      <div
        className="rounded-2xl p-4 space-y-2"
        style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        <p className="text-[10px] font-black tracking-[0.14em] uppercase text-brand-gold">
          {isEN ? "90 Days programme" : "Programa 90 Dias"}
        </p>
        <p className="text-zinc-300 text-xs leading-relaxed">
          {isEN
            ? "Week 1 starts on Monday. Block one is four weeks of a particular shape and starting it mid-week would cost you most of the first one. Train this week as it is."
            : "A semana 1 começa na segunda-feira. O primeiro bloco são quatro semanas com uma forma própria, e começá-lo a meio da semana custava-te quase toda a primeira. Esta semana treina o que está aí."}
        </p>
      </div>
    );
  }

  const week = state.currentWeek;
  const s = program90Structure(week);
  const pct = Math.round((week / PROGRAM_90_WEEKS) * 100);

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-black tracking-[0.14em] uppercase text-brand-gold">
          {isEN ? "90 Days programme" : "Programa 90 Dias"}
        </p>
        <p className="text-[11px] text-zinc-500">
          {isEN ? `Week ${week} of ${PROGRAM_90_WEEKS}` : `Semana ${week} de ${PROGRAM_90_WEEKS}`}
        </p>
      </div>

      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#E8C96B,#A8893A)" }}
        />
      </div>

      <p className="text-zinc-300 text-xs leading-relaxed">
        <span className="font-bold text-white">{isEN ? s.label.en : s.label.pt}</span>
        {". "}
        {s.test
          ? (isEN
            ? "Three sessions, little volume, one lift tested in each. Write down what you lift and compare it with week 1."
            : "Três treinos, pouco volume, um exercício testado em cada. Anota o que levantas e compara com a semana 1.")
          : s.deload
          ? (isEN
            ? "One set less on everything, same weight. This is the week that lets the next block go up."
            : "Menos uma série em tudo, com o mesmo peso. É esta semana que faz o bloco seguinte subir.")
          : (isEN
            ? "Hit the top of the repetition range on every set and the weight goes up next week."
            : "Chega ao topo do intervalo de repetições em todas as séries e o peso sobe na semana seguinte.")}
      </p>
    </div>
  );
}
