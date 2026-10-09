import { buildBasePlan, type BasePlan, type BasePlanInput, type Lang } from "./base-plan";

/**
 * The book's thirteen weeks, written into the app week by week.
 *
 * Somebody who bought "90 Dias" is holding a PDF they have to scroll through
 * every session, trying to remember which week they were on. The programme is
 * already built from the same generator the app uses, so the app can simply
 * write it: the week opens with the right session, the sets are logged, and
 * each week is compared with the last one. That is the whole point of the
 * book and the part a document cannot do.
 *
 * Nothing new is stored. The plan's name carries the week number, which is
 * enough to know who is following the programme and where they are, and this
 * repository cannot add columns.
 */

export const PROGRAM_90_WEEKS = 13;

/** "90 Dias · Semana 7". The number in the name is the state. */
export function program90Name(week: number, lang: Lang): string {
  return lang === "en" ? `90 Days · Week ${week}` : `90 Dias · Semana ${week}`;
}

const NAME_RE = /^90\s*(?:Dias|Days)\s*[·.\-]\s*(?:Semana|Week)\s*(\d{1,2})/i;

export function is90DaysPlan(name: string | null | undefined): boolean {
  return NAME_RE.test((name ?? "").trim());
}

export function program90WeekFromName(name: string | null | undefined): number | null {
  const m = NAME_RE.exec((name ?? "").trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 && n <= PROGRAM_90_WEEKS ? n : null;
}

export type PhaseNumber = 1 | 2 | 3;

export interface Program90Structure {
  week: number;
  /** Null on the test week, which belongs to no block. */
  phase: PhaseNumber | null;
  /** The fourth week of each block: one set less, same weight. */
  deload: boolean;
  /** Week 13: three sessions, one tested lift each. */
  test: boolean;
  label: { pt: string; en: string };
}

export function program90Structure(week: number): Program90Structure {
  if (week >= PROGRAM_90_WEEKS) {
    return {
      week: PROGRAM_90_WEEKS,
      phase: null,
      deload: true,
      test: true,
      label: { pt: "Semana de teste", en: "Test week" },
    };
  }
  const phase = (Math.floor((week - 1) / 4) + 1) as PhaseNumber;
  const deload = week % 4 === 0;
  const names: Record<PhaseNumber, { pt: string; en: string }> = {
    1: { pt: "Fundação", en: "Foundation" },
    2: { pt: "Volume", en: "Volume" },
    3: { pt: "Intensidade", en: "Intensity" },
  };
  return {
    week,
    phase,
    deload,
    test: false,
    label: deload
      ? { pt: `${names[phase].pt}, semana leve`, en: `${names[phase].en}, light week` }
      : names[phase],
  };
}

/**
 * What each block asks the generator for.
 *
 * The same three steps as the book: learn the patterns, then raise the volume,
 * then raise the load. The client's own equipment, days and language always
 * win, because a programme built around a gym they do not have is a programme
 * they will not follow.
 */
function phaseInput(week: number, input: BasePlanInput): BasePlanInput {
  const s = program90Structure(week);
  const days = input.trainingDays.length > 0 ? input.trainingDays : [1, 2, 4, 5];

  if (s.test) {
    // Three days, little volume. The book has them test one lift per session,
    // which is a note rather than a different set of exercises.
    return { ...input, level: "intermediate", trainingDays: days.slice(0, 3), sessionMinutes: 60, deload: true };
  }
  if (s.phase === 1) {
    return { ...input, level: "beginner", trainingDays: days, sessionMinutes: input.sessionMinutes ?? 60, deload: s.deload };
  }
  if (s.phase === 2) {
    return { ...input, level: "intermediate", trainingDays: days, sessionMinutes: Math.max(input.sessionMinutes ?? 60, 75), deload: s.deload };
  }
  return { ...input, level: "intermediate", trainingDays: days, sessionMinutes: Math.max(input.sessionMinutes ?? 60, 75), deload: s.deload };
}

/**
 * What separates one block from the next, in the person's own session.
 *
 * Blocks two and three come out of the generator with the same sets and the
 * same exercises, because what changes between them is how they are lifted:
 * more repetitions in one, more weight in the other. That instruction lives
 * in the book, and somebody following the programme in the app would never
 * see it, so it rides on the first exercise of the week.
 */
const WEEK_NOTE: Record<"p1" | "p2" | "p3" | "deload" | "test", { pt: string; en: string }> = {
  p1: {
    pt: "Fundação: escolhe pesos que te deixem 2 a 3 repetições na reserva e regista tudo.",
    en: "Foundation: pick weights that leave 2 to 3 repetitions in reserve, and log everything.",
  },
  p2: {
    pt: "Volume: sobe primeiro as repetições, só depois o peso. Sempre por essa ordem.",
    en: "Volume: add repetitions first, weight second. Always in that order.",
  },
  p3: {
    pt: "Intensidade: nos compostos trabalha na parte de baixo do intervalo, com mais peso. Nos isolamentos mantém as repetições altas.",
    en: "Intensity: on the compounds work at the bottom of the range, with more weight. Keep the repetitions high on isolation work.",
  },
  deload: {
    pt: "Semana leve: menos uma série em tudo, com o mesmo peso. É isto que faz o bloco seguinte subir.",
    en: "Light week: one set fewer on everything, same weight. This is what makes the next block go up.",
  },
  test: {
    pt: "Semana de teste: uma série a sério por treino, registada, e o resto leve. Compara com a semana 1.",
    en: "Test week: one real set per session, logged, and the rest light. Compare it with week 1.",
  },
};

function noteFor(week: number, lang: Lang): string {
  const s = program90Structure(week);
  const key = s.test ? "test" : s.deload ? "deload" : s.phase === 1 ? "p1" : s.phase === 2 ? "p2" : "p3";
  const head = lang === "en" ? `Week ${week} of ${PROGRAM_90_WEEKS}` : `Semana ${week} de ${PROGRAM_90_WEEKS}`;
  return `${head}. ${WEEK_NOTE[key][lang]}`;
}

export function buildProgram90Week(week: number, input: BasePlanInput): BasePlan {
  const plan = buildBasePlan(phaseInput(week, input));
  const note = noteFor(week, input.lang);

  // On the first exercise of the first session, where it is read before the
  // first set rather than after the week is over.
  let placed = false;
  const days = plan.days.map((d) => {
    if (placed || d.is_rest || d.exercises.length === 0) return d;
    placed = true;
    const [first, ...rest] = d.exercises;
    return {
      ...d,
      exercises: [{ ...first, notes: first.notes ? `${note} ${first.notes}` : note }, ...rest],
    };
  });

  return { name: program90Name(week, input.lang), days };
}

/** Monday of the week containing `date`, as YYYY-MM-DD, in UTC. */
function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function weeksBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / (7 * 86_400_000));
}

export interface Program90State {
  enrolled: boolean;
  /** Monday of week 1, derived from the earliest programme plan. */
  startMonday: string | null;
  /** Which week the current date falls on, even if that week has no plan yet. */
  currentWeek: number | null;
  /** True once the thirteenth week is behind them. */
  finished: boolean;
}

/**
 * Where a client is in the programme, read from the plans they already have.
 *
 * The week is computed from the calendar rather than from how many plans
 * exist: somebody who misses a week comes back to the week the programme is
 * on, not to the week after the last one written. That is also what the book
 * tells them to do.
 */
export function program90State(
  plans: { name: string | null; week_start: string }[],
  today = new Date(),
): Program90State {
  const mine = plans
    .map((p) => ({ week: program90WeekFromName(p.name), week_start: p.week_start }))
    .filter((p): p is { week: number; week_start: string } => p.week !== null)
    .sort((a, b) => a.week_start.localeCompare(b.week_start));

  if (mine.length === 0) {
    return { enrolled: false, startMonday: null, currentWeek: null, finished: false };
  }

  const first = mine[0];
  const startMonday = (() => {
    const d = new Date(first.week_start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - (first.week - 1) * 7);
    return d.toISOString().slice(0, 10);
  })();

  const current = 1 + weeksBetween(startMonday, mondayOf(today));
  return {
    enrolled: true,
    startMonday,
    currentWeek: current >= 1 && current <= PROGRAM_90_WEEKS ? current : null,
    finished: current > PROGRAM_90_WEEKS,
  };
}

/** The week number the programme is on for a given Monday, or null when it is over. */
export function program90WeekFor(startMonday: string, weekStart: string): number | null {
  const n = 1 + weeksBetween(startMonday, weekStart);
  return n >= 1 && n <= PROGRAM_90_WEEKS ? n : null;
}
