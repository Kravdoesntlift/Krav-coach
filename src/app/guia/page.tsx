"use client";

import { useActionState, useRef } from "react";
import Image from "next/image";
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

      {/* ── Hero with photo ── */}
      <div className="relative w-full" style={{ height: "56vw", maxHeight: 420, minHeight: 280 }}>
        <Image
          src="/andre-bg.jpg"
          alt="André Kravchuk"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Dark gradient overlay — top light, bottom fully dark */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0.5) 55%, #080808 100%)",
          }}
        />
        {/* Badge top-left */}
        <div className="absolute top-5 left-5">
          <span
            className="text-[10px] font-black tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#C9A84C",
            }}
          >
            KRAV COACH
          </span>
        </div>
        {/* Headline over photo */}
        <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
          <h1 className="text-3xl font-black text-white tracking-tight leading-[1.1]">
            Guia de Treino
            <br />
            <span style={{ color: "#C9A84C" }}>Gratuito</span>
          </h1>
        </div>
      </div>

      {/* ── Form section ── */}
      <div className="flex flex-col items-center px-5 pt-6 pb-14">
        <div className="w-full max-w-sm flex flex-col gap-6">

          <div className="text-center space-y-2">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Deixa o teu nome e email — enviamos o guia de imediato, sem spam.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
                Nome
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="O teu nome"
                autoComplete="given-name"
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="O teu email"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Error */}
            {state?.error && (
              <p className="text-red-400 text-xs text-center">{state.error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-4 rounded-xl font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 60%, #A8893A 100%)",
                color: "#000",
                boxShadow: "0 4px 24px rgba(201,168,76,0.2)",
              }}
            >
              {pending ? "A enviar..." : "Quero o Guia Grátis →"}
            </button>
          </form>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <p className="text-[11px] text-zinc-600 px-2">Sem spam. Prometemos.</p>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

        </div>
      </div>

    </main>
  );
}
