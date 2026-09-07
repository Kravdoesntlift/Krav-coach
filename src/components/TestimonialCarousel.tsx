"use client";

import { useEffect, useState } from "react";

export interface PublicTestimonial {
  id: string;
  display_name: string | null;
  content: string | null;
  rating: number | null;
  result_highlight: string | null;
  duration_weeks: number | null;
}

interface Props {
  testimonials: PublicTestimonial[];
  isEN: boolean;
}

function Card({ t, isEN }: { t: PublicTestimonial; isEN: boolean }) {
  return (
    <figure
      className="w-[300px] sm:w-[340px] shrink-0 rounded-2xl p-5 flex flex-col gap-3 snap-center"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {t.rating != null && (
        <div className="flex gap-0.5" aria-label={`${t.rating} ${isEN ? "out of 5" : "em 5"}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ color: i < t.rating! ? "#C9A84C" : "#27272a", fontSize: 14 }}>
              ★
            </span>
          ))}
        </div>
      )}
      <blockquote className="text-zinc-300 text-sm leading-relaxed flex-1">
        {t.content?.replace(/\s+—\s+/g, ", ")}
      </blockquote>
      <figcaption className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            {(t.display_name?.[0] ?? "?").toUpperCase()}
          </div>
          <span className="text-white text-xs font-semibold truncate">{t.display_name}</span>
        </div>
        {(t.result_highlight || t.duration_weeks) && (
          <span className="text-zinc-600 text-xs shrink-0">
            {t.result_highlight ?? `${t.duration_weeks} ${isEN ? "weeks" : "semanas"}`}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * A row of testimonials that moves on its own.
 *
 * Below four it renders a plain grid instead. A carousel of two cards looping
 * past you reads as a page with nothing to show, which is the opposite of what
 * social proof is for.
 *
 * The track holds the list twice and translates by exactly half its width, so
 * the loop has no seam. Movement pauses on hover, on touch and on keyboard
 * focus, because a testimonial that slides away while it is being read is worse
 * than one that never moved.
 */
export default function TestimonialCarousel({ testimonials, isEN }: Props) {
  // Hover pause is handled in CSS. This only covers the two cases CSS cannot
  // see: a finger on the track, and keyboard focus landing inside it.
  const [heldStill, setHeldStill] = useState(false);
  const [ready, setReady] = useState(false);

  // Measuring after mount keeps the first client render identical to the
  // server's; reading layout during render makes the two disagree.
  useEffect(() => setReady(true), []);

  if (testimonials.length < 4) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {testimonials.map((t) => (
          <div key={t.id} className="[&>figure]:w-full">
            <Card t={t} isEN={isEN} />
          </div>
        ))}
      </div>
    );
  }

  // Roughly six seconds per card, so a reader can finish one before it leaves.
  const duracao = testimonials.length * 6;

  return (
    <div
      className="marquee relative -mx-5 overflow-hidden"
      onFocusCapture={() => setHeldStill(true)}
      onBlurCapture={() => setHeldStill(false)}
      // Pause while a finger is down, then resume. Pausing on touchstart alone
      // left the row stopped for good after one accidental tap.
      onTouchStart={() => setHeldStill(true)}
      onTouchEnd={() => setHeldStill(false)}
      onTouchCancel={() => setHeldStill(false)}
    >
      {/* Fades the ends so cards enter and leave instead of being cut off */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10"
        style={{ background: "linear-gradient(90deg, #000 0%, transparent 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10"
        style={{ background: "linear-gradient(270deg, #000 0%, transparent 100%)" }}
      />

      <div
        className="marquee-track flex gap-4 px-5 will-change-transform"
        style={
          ready
            ? {
                width: "max-content",
                animation: `testimonial-marquee ${duracao}s linear infinite`,
                animationPlayState: heldStill ? "paused" : "running",
              }
            : undefined
        }
      >
        {testimonials.map((t) => (
          <Card key={t.id} t={t} isEN={isEN} />
        ))}
        {/* The second pass is decoration: screen readers should hear each
            testimonial once. */}
        {testimonials.map((t) => (
          <div key={`dup-${t.id}`} aria-hidden="true">
            <Card t={t} isEN={isEN} />
          </div>
        ))}
      </div>
    </div>
  );
}
