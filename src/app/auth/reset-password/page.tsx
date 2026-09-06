"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A password deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      if (err.message.includes("same password")) {
        setError("A nova password não pode ser igual à anterior.");
      } else {
        setError("Erro ao atualizar a password. O link pode ter expirado, pede um novo.");
      }
      return;
    }

    setDone(true);
    // Brief delay then redirect to login
    setTimeout(() => { window.location.href = "/auth/login"; }, 2500);
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

        <div
          className="rounded-3xl p-7 space-y-5"
          style={{
            background: "linear-gradient(160deg, rgba(39,39,42,0.9) 0%, rgba(18,18,22,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 64px rgba(0,0,0,0.5)",
          }}
        >
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.25)",
                }}
              >
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-white font-bold text-lg">Password atualizada!</p>
              <p className="text-zinc-400 text-sm">A redirecionar para o login…</p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-white text-xl font-bold tracking-tight">Nova password</h2>
                <p className="text-zinc-500 text-sm mt-0.5">Escolhe uma password segura para a tua conta.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="password" className="label">Nova password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="label">Confirmar password</label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                      A guardar...
                    </span>
                  ) : "Guardar nova password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
