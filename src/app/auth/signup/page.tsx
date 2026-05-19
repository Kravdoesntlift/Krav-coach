"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signup } from "../actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [coachId, setCoachId]   = useState<string | null>(null);
  const [refCode, setRefCode]   = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("coach");
    const r = p.get("ref");
    if (c) setCoachId(c);
    if (r) setRefCode(r);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;

    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }

    setLoading(true);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
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
              <p className="text-white font-bold text-lg">Confirma o teu email</p>
              <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
                Enviámos um email de confirmação. Clica no link para ativar a tua conta e depois faz login.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="btn-primary inline-block w-full py-3 rounded-xl text-sm text-center"
            >
              Ir para o Login
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
              <h2 className="text-white text-xl font-bold tracking-tight">Criar conta</h2>
              <p className="text-zinc-500 text-sm mt-0.5">Começa a tua jornada hoje</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {coachId && <input type="hidden" name="coach_id" value={coachId} />}
              {refCode && <input type="hidden" name="ref_code" value={refCode} />}

              {/* Invite banner — coach invite */}
              {coachId && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <span className="text-brand-gold text-lg shrink-0">🎯</span>
                  <p className="text-brand-gold/90 text-xs leading-relaxed">
                    Vais ser automaticamente atribuído ao teu coach ao criar a conta.
                  </p>
                </div>
              )}

              {/* Referral banner */}
              {refCode && !coachId && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <span className="text-brand-gold text-lg shrink-0">🤝</span>
                  <p className="text-brand-gold/90 text-xs leading-relaxed">
                    Foste convidado por um membro KRAV. Bem-vindo!
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="label">Nome completo</label>
                <input
                  id="full_name" name="full_name" type="text" required
                  autoComplete="name"
                  className="input"
                  placeholder="O teu nome"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email" name="email" type="email" required
                  autoComplete="email"
                  className="input"
                  placeholder="o@teu.email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <input
                  id="password" name="password" type="password" required
                  autoComplete="new-password" minLength={6}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="label">Confirmar password</label>
                <input
                  id="confirm_password" name="confirm_password" type="password" required
                  autoComplete="new-password" minLength={6}
                  className="input"
                  placeholder="Repete a password"
                />
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(201,168,76,0.07)",
                    border: "1px solid rgba(201,168,76,0.2)",
                  }}
                >
                  <span className="text-brand-gold mt-0.5 shrink-0">⚠</span>
                  <p className="text-brand-gold/90">{error}</p>
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
                    A criar conta...
                  </span>
                ) : "Criar conta"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-zinc-600 text-sm mt-5">
          Já tens conta?{" "}
          <Link href="/auth/login" className="text-brand-gold hover:text-brand-gold-light transition-colors font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
