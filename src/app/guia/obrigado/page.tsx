import Link from "next/link";
import type { Lang } from "@/lib/training/base-plan";

const T = {
  title: { pt: "Guia enviado!", en: "Guide sent!" },
  body: {
    pt: "Verifica o teu email. O guia já está na tua caixa de entrada.",
    en: "Check your email. The guide is already in your inbox.",
  },
  spam: {
    pt: "Não te esqueças de verificar o spam.",
    en: "Remember to check your spam folder.",
  },
  next: { pt: "Próximo passo", en: "Next step" },
  upsell: {
    pt: "O guia é o método. O trial de 7 dias põe-o na app, ajustado aos teus dias, ao teu nível e ao teu material. Sem cartão.",
    en: "The guide is the method. The 7 day trial puts it in the app, fitted to your days, your level and your equipment. No card.",
  },
  cta: { pt: "Começar o trial de 7 dias →", en: "Start the 7 day trial →" },
  back: { pt: "← Voltar", en: "← Back" },
} as const;

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang: Lang = langParam === "en" ? "en" : "pt";
  const startUrl = lang === "en" ? "/start?lang=en" : "/start";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ background: "#080808" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: "linear-gradient(135deg, #E8C96B, #A8893A)",
            boxShadow: "0 0 40px rgba(201,168,76,0.22)",
          }}
        >
          ✓
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">{T.title[lang]}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {T.body[lang]}
            <br />
            {T.spam[lang]}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.22), transparent)" }} />

        {/* Next step: the trial, which is where the guide actually gets used */}
        <div
          className="w-full p-5 rounded-2xl space-y-3 text-left"
          style={{ background: "#0f0f0f", border: "1px solid rgba(201,168,76,0.16)" }}
        >
          <p className="text-xs font-black tracking-[0.18em] uppercase" style={{ color: "rgba(201,168,76,0.55)" }}>
            {T.next[lang]}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {T.upsell[lang]}
          </p>
          <Link
            href={startUrl}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 60%, #A8893A 100%)",
              color: "#000",
              boxShadow: "0 4px 20px rgba(201,168,76,0.22)",
            }}
          >
            {T.cta[lang]}
          </Link>
        </div>

        <Link
          href="/links"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {T.back[lang]}
        </Link>

      </div>
    </main>
  );
}
