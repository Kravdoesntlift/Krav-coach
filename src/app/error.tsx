"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Offline: redirect to the offline page instead of showing generic error
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      window.location.replace("/offline");
      return;
    }
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-brand-gold">.</span>
        </h1>

        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/30 bg-red-500/10"
        >
          <span className="text-3xl font-black text-red-400">!</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">Algo correu mal</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Ocorreu um erro inesperado. Tenta novamente ou volta ao início.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-black text-sm transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Voltar ao início →
          </Link>
        </div>
      </div>
    </div>
  );
}
