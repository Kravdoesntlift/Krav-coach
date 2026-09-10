"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE_BUSINESS_URL } from "@/lib/seo";
import { STAR_PATH, initialsOf } from "@/lib/reviews";

export interface PublicTestimonial {
  id: string;
  display_name: string | null;
  content: string | null;
  rating: number | null;
  result_highlight: string | null;
  duration_weeks: number | null;
  /** Where the words were written. "google" ones carry a link to verify them. */
  source: string | null;
  /** Set when the author is a client in the app, which the card then says. */
  client_id: string | null;
  submitted_at: string | null;
}

interface Props {
  testimonials: PublicTestimonial[];
  isEN: boolean;
}

/** Constant reading speed, whatever the mix of card widths. */
const PX_PER_SECOND = 38;

const MONTHS = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/**
 * Month and year read straight off the ISO string rather than through Intl:
 * the server and the browser can ship different locale data, and a date that
 * renders differently on each is a hydration mismatch.
 */
function monthLabel(iso: string | null, isEN: boolean): string | null {
  if (!iso) return null;
  const m = Number(iso.slice(5, 7)) - 1;
  if (!(m >= 0 && m <= 11)) return null;
  return `${MONTHS[isEN ? "en" : "pt"][m]} ${iso.slice(0, 4)}`;
}

/**
 * Typography only, never a change of words: no space before punctuation, a
 * capital to open. What a visitor reads here has to be what they find on
 * Google when they go and check.
 */
function tidy(text: string): string {
  const t = text
    .trim()
    .replace(/\s+\u2014\s+/g, ", ")
    .replace(/\s+([,.!?;:])/g, "$1");
  return t.charAt(0).toLocaleUpperCase("pt-PT") + t.slice(1);
}

type Size = "short" | "medium" | "long";

function sizeOf(text: string): Size {
  if (text.length <= 60) return "short";
  if (text.length <= 220) return "medium";
  return "long";
}

/**
 * Width follows length and type size follows it the other way. A two-word
 * review set large reads as a headline; the same two words in body text at the
 * bottom of a tall card read as a card with nothing in it.
 */
const WIDTH: Record<Size, string> = {
  short: "w-[236px] sm:w-[260px]",
  medium: "w-[296px] sm:w-[340px]",
  long: "w-[min(84vw,400px)] sm:w-[440px]",
};

const QUOTE: Record<Size, string> = {
  short: "text-[22px] sm:text-2xl font-semibold tracking-tight text-white leading-snug",
  medium: "text-[15px] text-zinc-200 leading-relaxed",
  long: "text-[13.5px] sm:text-sm text-zinc-300 leading-relaxed",
};

/**
 * Strongest first, then long beside short. Taking alternately from both ends
 * of a length-sorted list gives the row a rhythm (a paragraph, then one line
 * that lands like a headline) instead of three walls of text and then three
 * slivers.
 */
function arrange(list: PublicTestimonial[]): PublicTestimonial[] {
  const byLength = [...list].sort((a, b) => (b.content?.length ?? 0) - (a.content?.length ?? 0));
  const out: PublicTestimonial[] = [];
  for (let i = 0, j = byLength.length - 1; i <= j; i++, j--) {
    out.push(byLength[i]);
    if (i !== j) out.push(byLength[j]);
  }
  return out;
}

function Stars({ n, isEN }: { n: number; isEN: boolean }) {
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${n} ${isEN ? "out of 5 stars" : "em 5 estrelas"}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="w-3.5 h-3.5" fill={i < n ? "#C9A84C" : "#27272a"} aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}

function Card({ t, isEN, fluid = false }: { t: PublicTestimonial; isEN: boolean; fluid?: boolean }) {
  const text = tidy(t.content ?? "");
  const size = sizeOf(text);
  const when = monthLabel(t.submitted_at, isEN);
  const isGoogle = t.source === "google";
  const isClient = t.client_id !== null;

  return (
    <figure
      className={`relative flex flex-col overflow-hidden rounded-[22px] p-6 border border-white/[0.07] hover:border-brand-gold/25 transition-colors duration-500 ${
        fluid ? "w-full" : WIDTH[size]
      }`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* An oversized closing quote as texture, not as punctuation */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-4 right-3 font-serif text-[128px] leading-none text-brand-gold/[0.08]"
      >
        &rdquo;
      </span>

      <div className="flex items-center justify-between gap-3">
        {t.rating != null && <Stars n={t.rating} isEN={isEN} />}
        {when && <span className="text-[11px] text-zinc-600 tabular-nums">{when}</span>}
      </div>

      <blockquote lang="pt" className={`flex-1 mt-4 mb-6 ${size === "short" ? "flex items-center" : ""}`}>
        <p className={QUOTE[size]}>{text}</p>
      </blockquote>

      <figcaption className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-brand-gold ring-1 ring-brand-gold/30"
          style={{ background: "linear-gradient(145deg, #1f1f23 0%, #0c0c0e 100%)" }}
        >
          {initialsOf(t.display_name)}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-white text-[13px] font-semibold truncate">{t.display_name}</span>
          {/* Two separate, checkable facts. "Client" means there is an account
              in the app behind the name. "On Google" links to where the same
              words can be read, because a quote nobody can verify is worth
              less than one anybody can. Google does not verify that a reviewer
              was a customer, so neither label says "verified". */}
          {(isClient || isGoogle) && (
            <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-500">
              {isClient && <span>{isEN ? "KRAV client" : "Cliente KRAV"}</span>}
              {isClient && isGoogle && <span aria-hidden="true" className="text-zinc-700">·</span>}
              {isGoogle && (
                <a
                  href={GOOGLE_BUSINESS_URL}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="hover:text-brand-gold transition-colors"
                >
                  {isEN ? "Review on Google ↗" : "Avaliação no Google ↗"}
                </a>
              )}
            </span>
          )}
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
 * A full-width row of reviews that moves on its own.
 *
 * Below four it renders a plain grid instead. A carousel of two cards looping
 * past you reads as a page with nothing to show, which is the opposite of what
 * social proof is for.
 *
 * The track holds the list twice and translates by exactly half its width, so
 * the loop has no seam. That only holds if half the track is exactly one pass,
 * so spacing is padding inside each item rather than `gap` (which leaves one
 * gap fewer than cards) and there is no padding on the track itself.
 *
 * Movement pauses on hover, on touch and on keyboard focus, because a review
 * that slides away while it is being read is worse than one that never moved.
 */
export default function TestimonialCarousel({ testimonials, isEN }: Props) {
  // Hover pause is handled in CSS. This only covers the two cases CSS cannot
  // see: a finger on the track, and keyboard focus landing inside it.
  const [heldStill, setHeldStill] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const ordered = arrange(testimonials);
  const moving = ordered.length >= 4;

  // Timed from the measured width, so the speed stays the same as reviews are
  // added and whatever their lengths. Measuring after mount also keeps the
  // first client render identical to the server's.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDuration(track.scrollWidth / 2 / PX_PER_SECOND);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [moving]);

  if (!moving) {
    return (
      <div className="max-w-2xl mx-auto px-5 grid gap-4 sm:grid-cols-2">
        {ordered.map((t) => (
          <Card key={t.id} t={t} isEN={isEN} fluid />
        ))}
      </div>
    );
  }

  return (
    <div
      className="marquee relative overflow-hidden pl-5"
      onFocusCapture={() => setHeldStill(true)}
      onBlurCapture={() => setHeldStill(false)}
      // Pause while a finger is down, then resume. Pausing on touchstart alone
      // left the row stopped for good after one accidental tap.
      onTouchStart={() => setHeldStill(true)}
      onTouchEnd={() => setHeldStill(false)}
      onTouchCancel={() => setHeldStill(false)}
    >
      {/* Fades the ends so cards arrive and leave instead of being cut off */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 sm:w-24 lg:w-40"
        style={{ background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0) 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 sm:w-24 lg:w-40"
        style={{ background: "linear-gradient(270deg, #000 0%, rgba(0,0,0,0) 100%)" }}
      />

      <div
        ref={trackRef}
        className="marquee-track flex w-max py-1 will-change-transform"
        style={
          // Longhands only. Mixing the `animation` shorthand with
          // animationPlayState makes React warn, and on a re-render it can
          // reset the play state it was meant to hold.
          duration
            ? {
                animationName: "testimonial-marquee",
                animationDuration: `${duration.toFixed(1)}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationPlayState: heldStill ? "paused" : "running",
              }
            : undefined
        }
      >
        {ordered.map((t) => (
          <div key={t.id} className="marquee-item flex shrink-0 pr-4 sm:pr-5">
            <Card t={t} isEN={isEN} />
          </div>
        ))}
        {/* The second pass is decoration. Screen readers should hear each
            review once, and its links should not be a second set of tab stops. */}
        {ordered.map((t) => (
          <div key={`dup-${t.id}`} aria-hidden="true" inert className="marquee-item marquee-dup flex shrink-0 pr-4 sm:pr-5">
            <Card t={t} isEN={isEN} />
          </div>
        ))}
      </div>
    </div>
  );
}
