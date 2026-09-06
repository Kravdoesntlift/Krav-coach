"use client";

import { useActionState } from "react";
import { submitGuiaForm } from "./actions";

const initialState = { error: "" };

export default function GuiaPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await submitGuiaForm(formData);
      return result ?? { error: "" };
    },
    initialState
  );

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#080808" }}>

      {/* ── Hero tipográfico ── */}
      <div
        className="relative w-full flex flex-col justify-end overflow-hidden"
        style={{ minHeight: 340, paddingBottom: 40 }}
      >
        {/* Fundo com glow dourado */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 80%, rgba(201,168,76,0.07) 0%, transparent 65%), #080808"
        }} />

        {/* Linhas decorativas */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {/* Linha horizontal topo */}
          <div className="absolute top-12 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.12),transparent)" }} />
          {/* Linha vertical esquerda */}
          <div className="absolute top-0 bottom-0 left-8 w-px" style={{ background: "linear-gradient(180deg,transparent,rgba(201,168,76,0.07),transparent)" }} />
          {/* Linha vertical direita */}
          <div className="absolute top-0 bottom-0 right-8 w-px" style={{ background: "linear-gradient(180deg,transparent,rgba(201,168,76,0.07),transparent)" }} />
          {/* Círculo decorativo */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{
            border: "1px solid rgba(201,168,76,0.05)",
          }} />
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full" style={{
            border: "1px solid rgba(201,168,76,0.04)",
          }} />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 px-6 pt-14">
          {/* Badge */}
          <div className="mb-5">
            <span
              className="text-[10px] font-black tracking-[0.28em] uppercase px-3.5 py-1.5 rounded-full"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.25)",
                color: "#C9A84C",
              }}
            >
              Download gratuito
            </span>
          </div>

          {/* Headline grande */}
          <h1 className="font-black text-white leading-[0.92] tracking-tighter" style={{ fontSize: "clamp(3rem, 14vw, 5rem)" }}>
            GUIA<br />
            <span style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 50%, #A8893A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              DE<br />TREINO
            </span>
          </h1>

          {/* Linha dourada */}
          <div className="mt-5 mb-4 h-[2px] w-10 rounded-full" style={{ background: "linear-gradient(90deg,#E8C96B,#A8893A)" }} />

          <p className="text-sm text-zinc-500 leading-relaxed max-w-[280px]">
            O essencial para treinares certo, sem planos genéricos, sem perder tempo.
          </p>
        </div>

        {/* Gradient de fade para a form card */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{
          background: "linear-gradient(to top, #080808 40%, transparent)"
        }} />
      </div>

      {/* ── Form card ── */}
      <div className="flex flex-col items-center px-5 pb-14 -mt-2">
        <div
          className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(201,168,76,0.15)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          <form action={formAction} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.5)" }}>
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="O teu nome"
                autoComplete="given-name"
                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-zinc-700 outline-none transition-all"
                style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)" }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.5)" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="O teu email"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-zinc-700 outline-none transition-all"
                style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.07)" }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {state?.error && (
              <p className="text-red-400 text-xs text-center -mt-1">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              style={{
                background: pending
                  ? "rgba(201,168,76,0.25)"
                  : "linear-gradient(135deg,#E8C96B 0%,#C9A84C 55%,#A8893A 100%)",
                color: "#000",
                boxShadow: pending ? "none" : "0 6px 32px rgba(201,168,76,0.22)",
              }}
            >
              {pending ? "A enviar…" : "Quero o Guia Grátis →"}
            </button>
          </form>

          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
            Sem spam. Podes cancelar a qualquer momento.
          </p>
        </div>
      </div>

    </main>
  );
}
