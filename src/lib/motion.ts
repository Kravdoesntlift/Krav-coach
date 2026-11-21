/**
 * The motion system.
 *
 * The app had 540 transitions and 44 declared durations, which means roughly
 * five hundred elements all moved at Tailwind's default 150ms on the same
 * curve. That is why it read as competent rather than expensive: nothing was
 * faster or slower than anything else, so nothing felt important.
 *
 * Every value here is named after the job it does, never after its number, so
 * a component asks for "the duration of a press" instead of picking 150 again.
 * The CSS custom properties in globals.css carry the same values; this module
 * exists for the places that need the number in JavaScript, mainly stagger
 * delays worked out from an index.
 */

/* ─── Duration ─────────────────────────────────────────────────────────────
   Four tiers, not a continuum. The ceiling is the Doherty threshold: past
   about 400ms a person stops feeling they caused the change and starts
   waiting for it, so only one tier is allowed above that and only for a
   movement nobody is waiting on. */
export const DURATION = {
  /** A state flip nobody should notice happening. Hover colour, focus ring. */
  instant: 90,
  /** Anything a finger just caused. Press, toggle, tick. */
  snap: 160,
  /** The default. Panels, reveals, the honest middle. */
  base: 260,
  /** Entrances that carry meaning and are allowed to be seen. */
  considered: 380,
  /** One orchestrated moment per view, never on something being waited for. */
  deliberate: 560,
} as const;

/* ─── Easing ───────────────────────────────────────────────────────────────
   Named after the animation principle each one serves. */
export const EASE = {
  /** Slow in and slow out: the standard, for anything with no opinion. */
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Leaving the screen. Fast off the mark, no settle, because it is gone. */
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  /** Arriving. All the deceleration at the end, so it lands rather than stops. */
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Exaggerated feedback: overshoots and comes back. Confirmations only. */
  overshoot: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Anticipation: pulls back before it goes. A wind-up for a committing action. */
  anticipate: "cubic-bezier(0.68, -0.35, 0.27, 1.35)",
} as const;

/* ─── Follow through ───────────────────────────────────────────────────────
   Siblings do not arrive together and they do not queue politely either. Each
   one starts before the one in front has finished, which is what reads as a
   group moving rather than a list being processed. */
export const STAGGER_MS = 55;
/** After this many items the delay stops growing: nobody waits out item 12. */
const STAGGER_CAP = 8;

export function staggerDelay(index: number): string {
  return `${Math.min(index, STAGGER_CAP) * STAGGER_MS}ms`;
}

/** The inline style for one item in a staggered group. */
export function staggered(index: number): React.CSSProperties {
  return { animationDelay: staggerDelay(index) };
}

/* ─── Fitts's law ──────────────────────────────────────────────────────────
   Apple's floor is 44x44 points and its absolute minimum is 28. Anything a
   finger has to hit gets the floor, which for small controls means growing
   the hit area without growing the thing that is drawn. */
export const TAP_MIN_PX = 44;
