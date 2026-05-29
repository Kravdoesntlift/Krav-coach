"use client";

import { useActionState } from "react";
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

      {/* ── Full-bleed photo hero ── */}
      <div className="relative w-full" style={{ height: "100svh", maxHeight: 680, minHeight: 500 }}>

        {/* Photo */}
        <Image
          src="/andre-bg.jpg"
          alt="André Kravchuk"
          fill
          className="object-cover"
          style={{ objectPosition: "center 15%" }}
          priority
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(8,8,8,0.25) 0%, rgba(8,8,8,0.1) 30%, rgba(8,8,8,0.6) 65%, #080808 100%)"
        }} />
        {/* Side vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)"
        }} />

        {/* Badge top */}
        <div className="absolute top-8 left-0 right-0 flex justify-center">
          <span
            className="text-[10px] font-black tracking-[0.28em] uppercase px-4 py-2 rounded-full"
            style={{
              background: "rgba(8,8,8,0.7)",
              border: "1px solid rgba(201,168,76,0.35)",
              color: "#C9A84C",
              backdropFilter: "blur(8px)",
            }}
          >
            KRAV COACH
          </span>
        </div>

        {/* Headline at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: "rgba(201,168,76,0.7)" }}>
            Download gratuito
          </p>
          <h1 className="text-[2.6rem] font-black text-white leading-[1.0] tracking-tight">
            Guia de<br />
            <span style={{
              background: "linear-gradient(135deg, #E8C96B, #C9A84C)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Treino
            </span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            O essencial para treinares certo — enviado<br />diretamente para o teu email.
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="relative z-10 flex flex-col items-center px-5 -mt-4 pb-14">
        <div
          className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(201,168,76,0.18)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.3)",
          }}
        >
          {/* Gold top line */}
          <div className="h-[2px] w-12 rounded-full mx-auto" style={{
            background: "linear-gradient(90deg, #E8C96B, #A8893A)"
          }} />

          <form action={formAction} className="flex flex-col gap-4">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: "rgba(201,168,76,0.55)" }}
              >
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
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.45)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[10px] font-black tracking-[0.2em] uppercase"
                style={{ color: "rgba(201,168,76,0.55)" }}
              >
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
                style={{
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.45)")}
                onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {/* Error */}
            {state?.error && (
              <p className="text-red-400 text-xs text-center -mt-1">{state.error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              style={{
                background: pending
                  ? "rgba(201,168,76,0.3)"
                  : "linear-gradient(135deg, #E8C96B 0%, #C9A84C 55%, #A8893A 100%)",
                color: "#000",
                boxShadow: pending ? "none" : "0 6px 32px rgba(201,168,76,0.25)",
              }}
            >
              {pending ? "A enviar…" : "Quero o Guia Grátis →"}
            </button>
          </form>

          {/* Trust line */}
          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Sem spam. Podes cancelar a qualquer momento.
          </p>
        </div>
      </div>

    </main>
  );
}
