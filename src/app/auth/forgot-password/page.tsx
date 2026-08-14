"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let result: Awaited<ReturnType<typeof forgotPassword>> | undefined;
    try {
      result = await forgotPassword(formData);
    } catch {
      setError("Não foi possível enviar agora. Espera um minuto e tenta outra vez.");
      setLoading(false);
      return;
    }
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    setDone(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.08) 0%, transparent 70%), #000",
      }}
    >
      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }}
      />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10 space-y-2">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
              border: "1px solid rgba(201,168,76,0.2)",
              boxShadow: "0 0 32px rgba(201,168,76,0.12)",
            }}
          >
            <span className="text-brand-gold font-black text-lg tracking-tighter">K</span>
          </div>
          <h1 className="text-[2.2rem] font-black tracking-[-0.04em] text-white leading-none">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
          <p className="text-zinc-600 text-xs font-semibold tracking-[0.2em] uppercase">
            Premium Coaching
          </p>
        </div>

        {done ? (
          <div
            className="rounded-3xl p-7 text-center space-y-4"
            style={{
              background: "linear-gradient(160deg, rgba(39,39,42,0.9) 0%, rgba(18,18,22,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Email enviado!</p>
              <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
                Se existe uma conta com esse email, receberás um link para redefinir a tua password.
                Verifica também a pasta de spam.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <div
            className="rounded-3xl p-7 space-y-5"
            style={{
              background: "linear-gradient(160deg, rgba(39,39,42,0.9) 0%, rgba(18,18,22,0.95) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div>
              <h2 className="text-white text-xl font-bold tracking-tight">Recuperar password</h2>
              <p className="text-zinc-500 text-sm mt-0.5">
                Envia-te um link para criares uma nova password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="email" className="label">Email da conta</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  placeholder="o@teu.email"
                />
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.25)",
                  }}
                >
                  <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl text-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    A enviar...
                  </span>
                ) : "Enviar link de recuperação"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-zinc-600 text-sm mt-5">
          <Link href="/auth/login" className="text-brand-gold hover:text-brand-gold-light transition-colors font-medium">
            ← Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
