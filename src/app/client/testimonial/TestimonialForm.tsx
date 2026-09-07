"use client";

import { useState, useTransition } from "react";
import { submitTestimonial } from "./actions";
import { GOOGLE_REVIEW_URL } from "@/lib/seo";
import type { Lang } from "@/lib/i18n";

interface Props {
  testimonial: {
    id: string;
    display_name: string;
    result_highlight: string | null;
    duration_weeks: number | null;
    content: string | null;
  };
  lang: Lang;
}

const copy = {
  heading:      { pt: "Partilha a tua experiência", en: "Share your experience" },
  sub:          { pt: "A tua opinião ajuda outros a conhecer o trabalho do teu coach.", en: "Your feedback helps others learn about your coach's work." },
  name_label:   { pt: "Nome de exibição", en: "Display name" },
  result_label: { pt: "Resultado em destaque", en: "Result highlight" },
  weeks_label:  { pt: "Semanas de acompanhamento", en: "Weeks of coaching" },
  content_label:{ pt: "O teu testemunho", en: "Your testimonial" },
  placeholder:  {
    pt: "Conta como foi a tua experiência com o teu coach, os resultados que alcançaste, o que mudou na tua vida, o que mais valorizaste...",
    en: "Tell us about your experience with your coach, the results you achieved, what changed in your life, what you valued most...",
  },
  submit:       { pt: "Enviar testemunho", en: "Submit testimonial" },
  submitting:   { pt: "A enviar...", en: "Submitting..." },
  success:      { pt: "Testemunho enviado! Obrigado 🙏", en: "Testimonial submitted! Thank you 🙏" },
  min_chars:    { pt: "Escreve pelo menos 30 caracteres.", en: "Please write at least 30 characters." },
  google_title: {
    pt: "Ajudas-me com mais um minuto?",
    en: "Can you spare one more minute?",
  },
  google_body:  {
    pt: "O que acabaste de escrever fica comigo. Uma avaliação no Google fica pública e é o que ajuda outra pessoa a decidir se pode confiar em mim.",
    en: "What you just wrote stays with me. A Google review is public, and that is what helps someone else decide whether they can trust me.",
  },
  google_cta:   { pt: "Avaliar no Google", en: "Review on Google" },
} as const;

export default function TestimonialForm({ testimonial, lang }: Props) {
  const [content, setContent] = useState(testimonial.content ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (content.trim().length < 30) {
      setError(copy.min_chars[lang]);
      return;
    }
    startTransition(async () => {
      const result = await submitTestimonial(testimonial.id, content.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 text-center space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-white font-semibold">{copy.success[lang]}</p>
        </div>

        {/* The moment right after someone writes something good about you is the
            only moment they are certain to be willing. Asking later, by message,
            reaches them while they are doing something else. Hidden entirely
            until a real review link exists. */}
        {GOOGLE_REVIEW_URL && (
          <div className="card-gold p-6 text-center space-y-3">
            <p className="text-white font-bold">{copy.google_title[lang]}</p>
            <p className="text-zinc-400 text-sm leading-relaxed">{copy.google_body[lang]}</p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block px-6 py-3 mt-1"
            >
              {copy.google_cta[lang]}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-white font-bold text-base">{copy.heading[lang]}</h2>
        <p className="text-zinc-500 text-sm">{copy.sub[lang]}</p>
      </div>

      {/* Pre-filled info from coach */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs font-medium">{copy.name_label[lang]}</p>
          <p className="text-white text-sm bg-zinc-800 rounded-xl px-3 py-2.5">
            {testimonial.display_name}
          </p>
        </div>
        {testimonial.result_highlight && (
          <div className="space-y-1">
            <p className="text-zinc-500 text-xs font-medium">{copy.result_label[lang]}</p>
            <p className="text-brand-gold text-sm bg-zinc-800 rounded-xl px-3 py-2.5">
              {testimonial.result_highlight}
            </p>
          </div>
        )}
        {testimonial.duration_weeks && (
          <div className="space-y-1">
            <p className="text-zinc-500 text-xs font-medium">{copy.weeks_label[lang]}</p>
            <p className="text-white text-sm bg-zinc-800 rounded-xl px-3 py-2.5">
              {testimonial.duration_weeks} semanas
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-zinc-400 text-xs font-medium">
            {copy.content_label[lang]}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={copy.placeholder[lang]}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 resize-none focus:outline-none focus:border-brand-gold"
          />
          <p className="text-zinc-600 text-xs text-right">{content.length} caracteres</p>
        </div>

        <button
          type="submit"
          disabled={isPending || content.trim().length < 30}
          className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          {isPending ? copy.submitting[lang] : copy.submit[lang]}
        </button>
      </form>
    </div>
  );
}
