import type { Lang } from "@/lib/training/base-plan";

/**
 * The community, and the group currently running the programme.
 *
 * Two things that only make sense together: a room where people following the
 * programme can be told things that are not worth a public post, and a start
 * date so there is something to be early or late for. A PDF on sale forever
 * has no reason to be bought today; a group that starts on a Monday does.
 *
 * Deliberately light on imports, because the links page is a client component
 * and must not pull the training generator into the browser bundle.
 */

/* ─── Where it lives ───────────────────────────────────────────────────────── */

/**
 * The Instagram broadcast channel invite, of the form `https://ig.me/j/<code>`.
 *
 * An Instagram channel and not WhatsApp or Telegram, for one reason that
 * decides it: in a WhatsApp group every member sees every other member's phone
 * number, André's included. A broadcast channel shows nobody's number, not his
 * and not theirs, and it lives inside the app the audience is already in, so
 * joining costs one tap instead of installing something.
 *
 * Empty until the channel exists. Everything that links to it checks first and
 * stays quiet rather than sending people to a dead link, so this can ship
 * before the channel is created. Set it here, or override per environment with
 * NEXT_PUBLIC_COMMUNITY_URL.
 */
export const COMMUNITY_URL: string = process.env.NEXT_PUBLIC_COMMUNITY_URL || "";

/** Whether there is a room to send anybody to yet. */
export const communityOpen: boolean = /^https:\/\//.test(COMMUNITY_URL);

/* ─── The group ────────────────────────────────────────────────────────────── */

/**
 * The Monday the current group starts. A Monday because week one of the
 * programme opens on a Monday, and `startProgram90` refuses to begin a week
 * later than Wednesday precisely so nobody gets a block one with two sessions
 * in it.
 */
export const COHORT_START = "2026-11-02";

/**
 * Thirteen, the same thirteen as `PROGRAM_90_WEEKS`. Repeated rather than
 * imported so this module stays free of the training generator; if the
 * programme ever changes length, both say so.
 */
export const COHORT_WEEKS = 13;

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type CohortPhase = "before" | "running" | "finished";

export interface CohortState {
  phase: CohortPhase;
  /** Days until the first Monday. Zero on the day itself, negative after. */
  daysUntil: number;
  /** The week the group is on, 1 to 13. Only meaningful while running. */
  week: number;
}

/**
 * Today's date as Lisbon sees it.
 *
 * The server runs in UTC and the coach is in Vietnam, but the people counting
 * down are in Portugal, and "how many days until Monday" has to be their
 * Monday. Comparing calendar days rather than instants also sidesteps the
 * clock change at the end of October, which falls between now and the start.
 */
function lisbonDay(now: Date): [number, number, number] {
  const text = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = text.split("-").map(Number);
  return [y, m, d];
}

export function cohortState(now: Date = new Date()): CohortState {
  const [sy, sm, sd] = COHORT_START.split("-").map(Number);
  const [y, m, d] = lisbonDay(now);

  const start = Date.UTC(sy, sm - 1, sd);
  const today = Date.UTC(y, m - 1, d);
  const daysUntil = Math.round((start - today) / 86_400_000);

  if (daysUntil > 0) return { phase: "before", daysUntil, week: 0 };

  const week = Math.floor(-daysUntil / 7) + 1;
  if (week > COHORT_WEEKS) return { phase: "finished", daysUntil, week: COHORT_WEEKS };
  return { phase: "running", daysUntil, week };
}

/** "2 de Novembro" / "2 November". */
export function cohortStartLabel(lang: Lang = "pt"): string {
  const [, m, d] = COHORT_START.split("-").map(Number);
  return lang === "en"
    ? `${d} ${MONTHS_EN[m - 1]}`
    : `${d} de ${MONTHS_PT[m - 1]}`;
}

/** "Turma de 2 de Novembro". */
export function cohortName(lang: Lang = "pt"): string {
  return lang === "en"
    ? `${cohortStartLabel("en")} group`
    : `Turma de ${cohortStartLabel("pt")}`;
}
