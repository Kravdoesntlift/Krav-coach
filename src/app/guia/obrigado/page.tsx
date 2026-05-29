import Link from "next/link";

export default function ObrigadoPage() {
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
            boxShadow: "0 0 40px rgba(201,168,76,0.2)",
          }}
        >
          ✓
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Guia enviado!</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Verifica o teu email — o guia já está na tua caixa de entrada.
            <br />
            Não te esqueças de verificar o spam.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

        {/* Upsell */}
        <div
          className="w-full p-5 rounded-2xl space-y-3 text-left"
          style={{ background: "#0f0f0f", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <p className="text-xs font-black tracking-[0.18em] uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
            Próximo passo
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Se quiseres resultados ainda mais rápidos com um plano feito a 100% para ti, tenho vagas de coaching online.
          </p>
          <a
            href="https://www.kravcoaching.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 60%, #A8893A 100%)",
              color: "#000",
              boxShadow: "0 4px 20px rgba(201,168,76,0.2)",
            }}
          >
            Ver Coaching Online →
          </a>
        </div>

        <Link
          href="/links"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Voltar
        </Link>

      </div>
    </main>
  );
}
