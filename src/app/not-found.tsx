import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-brand-gold">.</span>
        </h1>

        <div className="space-y-2">
          <p className="text-7xl font-black text-zinc-800">404</p>
          <h2 className="text-white text-xl font-bold">Página não encontrada</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Esta página não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-black text-sm transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Voltar ao início
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Entrar na app →
          </Link>
        </div>
      </div>
    </div>
  );
}
