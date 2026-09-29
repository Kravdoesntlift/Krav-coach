import TierChooser from "@/components/client/TierChooser";
import { getLang } from "@/lib/i18n/getLang";

/**
 * The two plans, reachable while the trial is still running.
 *
 * The trial banner used to start a checkout straight away, at the only price
 * that existed. Someone deciding whether to carry on should see both, and see
 * what the cheaper one does not include, before paying anything.
 */

export const metadata = {
  title: "Planos · KRAV Coach",
  robots: { index: false, follow: false },
};

export default async function PlanosPage() {
  const lang = await getLang();
  const isEN = lang === "en";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.7)" }}>
          {isEN ? "Plans" : "Planos"}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">
          {isEN ? "Two ways to carry on" : "Duas formas de continuar"}
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          {isEN
            ? "Both keep everything you have logged. The difference is who writes your plan."
            : "Os dois mantêm tudo o que já registaste. A diferença é quem escreve o teu plano."}
        </p>
      </div>

      <TierChooser lang={lang} />
    </div>
  );
}
