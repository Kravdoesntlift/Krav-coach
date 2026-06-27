"use client";

import { useActionState, useState } from "react";
import { submitTrialFeedback } from "@/app/client/feedback/actions";

export default function TrialFeedbackSection() {
  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const result = await submitTrialFeedback(prev, fd);
      if (result.success) setSubmitted(true);
      return result;
    },
    null
  );

  if (submitted) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-5 text-center space-y-2">
        <p className="text-2xl">🙏</p>
        <p className="text-white font-bold text-sm">Obrigado pelo teu feedback!</p>
        <p className="text-zinc-500 text-xs">O teu testemunho ajuda-nos a melhorar. Se mudares de ideias sobre a subscrição, podemos reactivar em qualquer momento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-5 space-y-4">
      <div className="text-center">
        <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase mb-1">Antes de saires</p>
        <p className="text-white text-sm font-bold">Como foi a tua experiência no trial?</p>
        <p className="text-zinc-600 text-xs mt-1">1–2 minutos · Anónimo se preferires</p>
      </div>

      <form action={action} className="space-y-4">
        {/* Star rating */}
        <input type="hidden" name="rating" value={rating} />
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform active:scale-90"
              aria-label={`${s} estrelas`}
            >
              <span style={{ color: s <= (hovered || rating) ? "#C9A84C" : "#3f3f46" }}>★</span>
            </button>
          ))}
        </div>

        {/* Feedback text */}
        <textarea
          name="content"
          rows={3}
          required
          minLength={10}
          maxLength={400}
          placeholder="O que gostaste mais? O que poderia ser melhor?"
          className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold/40 resize-none"
        />

        {/* Would recommend */}
        <div className="flex gap-2">
          <label className="flex-1">
            <input type="radio" name="would_recommend" value="yes" className="sr-only peer" />
            <div className="text-center rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-500 cursor-pointer peer-checked:border-green-500/50 peer-checked:bg-green-500/10 peer-checked:text-green-400 transition-all select-none">
              👍 Recomendaria
            </div>
          </label>
          <label className="flex-1">
            <input type="radio" name="would_recommend" value="no" className="sr-only peer" />
            <div className="text-center rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-500 cursor-pointer peer-checked:border-red-500/50 peer-checked:bg-red-500/10 peer-checked:text-red-400 transition-all select-none">
              👎 Não recomendaria
            </div>
          </label>
        </div>

        {state?.error && state.error !== "not_authenticated" && (
          <p className="text-red-400 text-xs text-center">
            {state.error === "missing_rating"
              ? "Selecciona uma classificação (1-5 estrelas)."
              : state.error === "content_too_short"
              ? "Escreve pelo menos 10 caracteres."
              : "Erro ao guardar. Tenta novamente."}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || rating === 0}
          className="w-full rounded-xl border border-zinc-700 text-zinc-300 text-sm font-semibold py-3 hover:border-zinc-500 hover:text-white disabled:opacity-40 transition-all active:scale-95"
        >
          {pending ? "A enviar..." : "Enviar feedback →"}
        </button>
      </form>
    </div>
  );
}
