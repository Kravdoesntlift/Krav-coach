"use client";

import { useActionState, useState } from "react";
import { submitGuiaForm } from "./actions";
import type { Lang } from "@/lib/training/base-plan";

/**
 * The form that turns a visitor into a lead.
 *
 * It asks one extra thing now: where they train. A gym guide handed to someone
 * with a living room and two dumbbells is a guide they cannot use, and the
 * first impression of the whole business is that it was not written for them.
 */

type Place = "gym" | "home" | "outdoor";

const T = {
  name: { pt: "Nome", en: "Name" },
  namePlaceholder: { pt: "O teu nome", en: "Your name" },
  email: { pt: "Email", en: "Email" },
  emailPlaceholder: { pt: "O teu email", en: "Your email" },
  place: { pt: "Onde treinas?", en: "Where do you train?" },
  placeHint: {
    pt: "Mandamos o guia com o plano certo para o teu caso.",
    en: "We send the guide with the plan that fits your case.",
  },
  gym: { pt: "Ginásio", en: "Gym" },
  home: { pt: "Casa", en: "Home" },
  outdoor: { pt: "Ar livre", en: "Outdoors" },
  submit: { pt: "Quero o Guia Grátis →", en: "Send me the free guide →" },
  sending: { pt: "A enviar…", en: "Sending…" },
  noSpam: {
    pt: "Sem spam. Podes cancelar a qualquer momento.",
    en: "No spam. Unsubscribe whenever you want.",
  },
} as const;

const PLACES: { value: Place; icon: string }[] = [
  { value: "gym", icon: "🏋️" },
  { value: "home", icon: "🏠" },
  { value: "outdoor", icon: "🌳" },
];

export default function GuiaForm({ lang }: { lang: Lang }) {
  const [place, setPlace] = useState<Place>("gym");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string }, formData: FormData) => {
      const result = await submitGuiaForm(formData);
      return result ?? { error: "" };
    },
    { error: "" },
  );

  const field =
    "w-full px-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder-zinc-700 outline-none transition-all";
  const fieldStyle = { background: "#141414", border: "1px solid rgba(255,255,255,0.07)" };
  const labelClass = "text-[10px] font-black tracking-[0.2em] uppercase";
  const labelStyle = { color: "rgba(201,168,76,0.55)" };

  return (
    <div
      className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
      style={{
        background: "#0f0f0f",
        border: "1px solid rgba(201,168,76,0.16)",
        boxShadow: "0 0 60px rgba(0,0,0,0.5)",
      }}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="place" value={place} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={labelClass} style={labelStyle}>
            {T.name[lang]}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={T.namePlaceholder[lang]}
            autoComplete="given-name"
            className={field}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClass} style={labelStyle}>
            {T.email[lang]}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={T.emailPlaceholder[lang]}
            autoComplete="email"
            className={field}
            style={fieldStyle}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="place-label" className={labelClass} style={labelStyle}>
            {T.place[lang]}
          </span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="place-label">
            {PLACES.map((option) => {
              const selected = place === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPlace(option.value)}
                  className="flex flex-col items-center gap-1 rounded-xl py-3 text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: selected ? "rgba(201,168,76,0.12)" : "#141414",
                    border: `1px solid ${selected ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.07)"}`,
                    color: selected ? "#C9A84C" : "#71717a",
                  }}
                >
                  <span className="text-base leading-none">{option.icon}</span>
                  {T[option.value][lang]}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            {T.placeHint[lang]}
          </p>
        </div>

        {state?.error && <p className="text-red-400 text-xs text-center -mt-1">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          style={{
            background: pending
              ? "rgba(201,168,76,0.28)"
              : "linear-gradient(135deg,#E8C96B 0%,#C9A84C 55%,#A8893A 100%)",
            color: "#000",
            boxShadow: pending ? "none" : "0 6px 32px rgba(201,168,76,0.22)",
          }}
        >
          {pending ? T.sending[lang] : T.submit[lang]}
        </button>
      </form>

      <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
        {T.noSpam[lang]}
      </p>
    </div>
  );
}
