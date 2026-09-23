/**
 * The KRAV base programme, built from the answers given at signup.
 *
 * The free guide ("De Magro a Estético em 90 Dias") is the method: mechanical
 * tension, progressive overload, recovery, with a five day split. This turns
 * that method into an actual week for one person: their days, their level,
 * their equipment, their session length.
 *
 * It is deliberately not the PDF pasted into the app. Someone who downloaded
 * the guide already has the PDF; handing it back would make the trial feel
 * like a worse version of something they already own. What the app adds is
 * that the plan fits their week and that every set is logged and compared with
 * the week before, which is the whole argument of the guide.
 *
 * No AI, on purpose: the same answers must always produce the same plan, it
 * must cost nothing per signup, and it must never invent an exercise.
 */

export type Level = "beginner" | "intermediate" | "advanced";
export type Equipment = "gym_full" | "gym_basic" | "home_weights" | "home_none" | "outdoor";
export type Goal = "lose_weight" | "gain_muscle" | "athletic";
export type Lang = "pt" | "en";

export interface BasePlanInput {
  level: Level | null;
  equipment: Equipment | null;
  goal: Goal | null;
  /** Weekdays picked in the quiz, JS numbering (0 = Sunday). */
  trainingDays: number[];
  /** How many days a week they said they can train, when no days were picked. */
  daysPerWeek?: number | null;
  sessionMinutes: number | null;
  lang: Lang;
  /**
   * For the week already in progress: the weekday the plan starts on, in JS
   * numbering. Days before it become rest.
   *
   * A plan written on a Wednesday that still shows Monday and Tuesday as
   * training days opens the trial with two workouts already missed, which is a
   * miserable first screen and not even true.
   */
  startOnWeekday?: number | null;
}

export interface BasePlanExercise {
  name: string;
  sets: number;
  reps: string;
  notes: string | null;
  order_index: number;
}

export interface BasePlanDay {
  day_of_week: number;
  label: string;
  is_rest: boolean;
  order_index: number;
  exercises: BasePlanExercise[];
}

export interface BasePlan {
  name: string;
  days: BasePlanDay[];
}

// ─── Movements ────────────────────────────────────────────────────────────────
// Each movement names its full gym version and what replaces it when the gym,
// or the equipment, is not there. A missing swap means the movement already
// works with whatever that person has.

type Names = { pt: string; en: string };

interface Movement {
  pt: string;
  en: string;
  compound?: boolean;
  swaps?: Partial<Record<Equipment, Names>>;
}

const M = {
  bench: {
    pt: "Supino com barra", en: "Barbell bench press", compound: true,
    swaps: {
      gym_basic:    { pt: "Supino com halteres", en: "Dumbbell bench press" },
      home_weights: { pt: "Supino com halteres no chão", en: "Floor press with dumbbells" },
      home_none:    { pt: "Flexões", en: "Push-ups" },
      outdoor:      { pt: "Flexões", en: "Push-ups" },
    },
  },
  inclinePress: {
    pt: "Press inclinado", en: "Incline press", compound: true,
    swaps: {
      gym_basic:    { pt: "Press inclinado com halteres", en: "Incline dumbbell press" },
      home_weights: { pt: "Press inclinado com halteres", en: "Incline dumbbell press" },
      home_none:    { pt: "Flexões com pés elevados", en: "Feet-elevated push-ups" },
      outdoor:      { pt: "Flexões com pés elevados", en: "Feet-elevated push-ups" },
    },
  },
  ohp: {
    pt: "Press militar", en: "Overhead press", compound: true,
    swaps: {
      gym_basic:    { pt: "Press militar com halteres", en: "Dumbbell overhead press" },
      home_weights: { pt: "Press militar com halteres", en: "Dumbbell overhead press" },
      home_none:    { pt: "Pike push-up", en: "Pike push-up" },
      outdoor:      { pt: "Pike push-up", en: "Pike push-up" },
    },
  },
  arnold: {
    pt: "Press Arnold", en: "Arnold press",
    swaps: {
      home_none: { pt: "Pike push-up lento", en: "Slow pike push-up" },
      outdoor:   { pt: "Pike push-up lento", en: "Slow pike push-up" },
    },
  },
  row: {
    pt: "Remada curvada", en: "Barbell row", compound: true,
    swaps: {
      gym_basic:    { pt: "Remada com halteres", en: "Dumbbell row" },
      home_weights: { pt: "Remada unilateral com halter", en: "Single-arm dumbbell row" },
      home_none:    { pt: "Remada invertida na mesa", en: "Inverted row under a table" },
      outdoor:      { pt: "Remada invertida na barra", en: "Inverted row on a bar" },
    },
  },
  machineRow: {
    pt: "Remada na máquina", en: "Machine row", compound: true,
    swaps: {
      gym_basic:    { pt: "Remada com halteres", en: "Dumbbell row" },
      home_weights: { pt: "Remada unilateral com halter", en: "Single-arm dumbbell row" },
      home_none:    { pt: "Remada invertida na mesa", en: "Inverted row under a table" },
      outdoor:      { pt: "Remada invertida na barra", en: "Inverted row on a bar" },
    },
  },
  pulldown: {
    pt: "Pulldown pega larga", en: "Wide-grip pulldown", compound: true,
    swaps: {
      gym_basic:    { pt: "Elevações assistidas", en: "Assisted pull-ups" },
      home_weights: { pt: "Puxada com banda elástica", en: "Band pulldown" },
      home_none:    { pt: "Remada invertida na mesa", en: "Inverted row under a table" },
      outdoor:      { pt: "Elevações na barra", en: "Pull-ups" },
    },
  },
  squat: {
    pt: "Agachamento", en: "Squat", compound: true,
    swaps: {
      gym_basic:    { pt: "Agachamento goblet", en: "Goblet squat" },
      home_weights: { pt: "Agachamento goblet", en: "Goblet squat" },
      home_none:    { pt: "Agachamento livre", en: "Bodyweight squat" },
      outdoor:      { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
    },
  },
  rdl: {
    pt: "Peso morto romeno", en: "Romanian deadlift", compound: true,
    swaps: {
      gym_basic:    { pt: "Peso morto romeno com halteres", en: "Dumbbell Romanian deadlift" },
      home_weights: { pt: "Peso morto romeno com halteres", en: "Dumbbell Romanian deadlift" },
      home_none:    { pt: "Ponte de glúteo a uma perna", en: "Single-leg glute bridge" },
      outdoor:      { pt: "Ponte de glúteo a uma perna", en: "Single-leg glute bridge" },
    },
  },
  legPress: {
    pt: "Leg press", en: "Leg press", compound: true,
    swaps: {
      gym_basic:    { pt: "Agachamento goblet", en: "Goblet squat" },
      home_weights: { pt: "Agachamento com halteres", en: "Dumbbell squat" },
      home_none:    { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
      outdoor:      { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
    },
  },
  lunge: { pt: "Afundos", en: "Lunges", compound: true },
  hipThrust: {
    pt: "Hip thrust", en: "Hip thrust", compound: true,
    swaps: {
      home_none: { pt: "Ponte de glúteo", en: "Glute bridge" },
      outdoor:   { pt: "Ponte de glúteo", en: "Glute bridge" },
    },
  },
  curl: {
    pt: "Curl com barra", en: "Barbell curl",
    swaps: {
      gym_basic:    { pt: "Curl com halteres", en: "Dumbbell curl" },
      home_weights: { pt: "Curl com halteres", en: "Dumbbell curl" },
      home_none:    { pt: "Remada invertida supinada", en: "Underhand inverted row" },
      outdoor:      { pt: "Elevações supinadas", en: "Chin-ups" },
    },
  },
  inclineCurl: {
    pt: "Curl inclinado", en: "Incline curl",
    swaps: {
      home_none: { pt: "Remada invertida supinada", en: "Underhand inverted row" },
      outdoor:   { pt: "Elevações supinadas", en: "Chin-ups" },
    },
  },
  hammer: {
    pt: "Curl martelo", en: "Hammer curl",
    swaps: {
      home_none: { pt: "Remada invertida pega neutra", en: "Neutral-grip inverted row" },
      outdoor:   { pt: "Elevações pega neutra", en: "Neutral-grip pull-ups" },
    },
  },
  tricepsSkull: {
    pt: "Trícep testa", en: "Skull crushers",
    swaps: {
      home_none: { pt: "Flexões diamante", en: "Diamond push-ups" },
      outdoor:   { pt: "Fundos em banco", en: "Bench dips" },
    },
  },
  tricepsRope: {
    pt: "Trícep na corda", en: "Triceps rope pushdown",
    swaps: {
      gym_basic:    { pt: "Trícep francês com halter", en: "Overhead dumbbell extension" },
      home_weights: { pt: "Trícep francês com halter", en: "Overhead dumbbell extension" },
      home_none:    { pt: "Flexões diamante", en: "Diamond push-ups" },
      outdoor:      { pt: "Fundos em banco", en: "Bench dips" },
    },
  },
  lateralRaise: {
    pt: "Elevações laterais", en: "Lateral raises",
    swaps: {
      home_none: { pt: "Elevações laterais isométricas", en: "Isometric lateral raises" },
      outdoor:   { pt: "Elevações laterais isométricas", en: "Isometric lateral raises" },
    },
  },
  facePull: {
    pt: "Face pull", en: "Face pull",
    swaps: {
      gym_basic:    { pt: "Face pull com banda", en: "Band face pull" },
      home_weights: { pt: "Face pull com banda", en: "Band face pull" },
      home_none:    { pt: "Superman com retração escapular", en: "Superman with scapular squeeze" },
      outdoor:      { pt: "Face pull com banda", en: "Band face pull" },
    },
  },
  chestFly: {
    pt: "Chest fly na máquina", en: "Machine chest fly",
    swaps: {
      gym_basic:    { pt: "Crucifixo com halteres", en: "Dumbbell fly" },
      home_weights: { pt: "Crucifixo com halteres", en: "Dumbbell fly" },
      home_none:    { pt: "Flexões abertas", en: "Wide push-ups" },
      outdoor:      { pt: "Flexões abertas", en: "Wide push-ups" },
    },
  },
  legCurl: {
    pt: "Leg curl", en: "Leg curl",
    swaps: {
      gym_basic:    { pt: "Ponte de isquios a uma perna", en: "Single-leg hamstring bridge" },
      home_weights: { pt: "Ponte de isquios a uma perna", en: "Single-leg hamstring bridge" },
      home_none:    { pt: "Ponte de isquios a uma perna", en: "Single-leg hamstring bridge" },
      outdoor:      { pt: "Ponte de isquios a uma perna", en: "Single-leg hamstring bridge" },
    },
  },
  legExtension: {
    pt: "Extensão de quadríceps", en: "Leg extension",
    swaps: {
      gym_basic:    { pt: "Agachamento sissy", en: "Sissy squat" },
      home_weights: { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
      home_none:    { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
      outdoor:      { pt: "Agachamento búlgaro", en: "Bulgarian split squat" },
    },
  },
  calf: { pt: "Gémeos em pé", en: "Standing calf raise" },
  adductor: {
    pt: "Adutor na máquina", en: "Machine adductor",
    swaps: {
      gym_basic:    { pt: "Agachamento sumo com halter", en: "Dumbbell sumo squat" },
      home_weights: { pt: "Agachamento sumo com halter", en: "Dumbbell sumo squat" },
      home_none:    { pt: "Agachamento sumo", en: "Sumo squat" },
      outdoor:      { pt: "Agachamento sumo", en: "Sumo squat" },
    },
  },
  plank: { pt: "Prancha", en: "Plank" },
} satisfies Record<string, Movement>;

type MovementId = keyof typeof M;

// ─── Sessions ─────────────────────────────────────────────────────────────────
// The five day split from the guide, plus the shapes it collapses into when
// someone trains fewer days. Compounds first: the exercise that decides the
// session is the one you meet with the most in the tank.

interface Session {
  label: Names;
  movements: MovementId[];
  /** Added only when the session has room for a sixth exercise. */
  finisher: MovementId;
  /**
   * Stand-ins, used when an equipment swap collapses two movements into the
   * same exercise. Without them a home workout asks for "inverted row" twice
   * in one session, which reads as a bug to anyone who trains.
   */
  reserves: MovementId[];
}

const SESSIONS = {
  upperStrength: {
    label: { pt: "Upper · Força", en: "Upper · Strength" },
    movements: ["bench", "row", "ohp", "curl", "tricepsSkull"],
    finisher: "plank",
    reserves: ["facePull", "hammer", "lateralRaise", "plank"],
  },
  lowerStrength: {
    label: { pt: "Lower · Força", en: "Lower · Strength" },
    movements: ["squat", "rdl", "legPress", "lunge", "hipThrust"],
    finisher: "calf",
    reserves: ["legCurl", "calf", "adductor", "plank"],
  },
  pull: {
    label: { pt: "Pull · Hipertrofia", en: "Pull · Hypertrophy" },
    movements: ["pulldown", "machineRow", "facePull", "inclineCurl", "hammer"],
    finisher: "plank",
    reserves: ["row", "curl", "plank"],
  },
  push: {
    label: { pt: "Push · Hipertrofia", en: "Push · Hypertrophy" },
    movements: ["inclinePress", "chestFly", "lateralRaise", "arnold", "tricepsRope"],
    finisher: "plank",
    reserves: ["bench", "ohp", "tricepsSkull", "plank"],
  },
  legs: {
    label: { pt: "Legs · Hipertrofia", en: "Legs · Hypertrophy" },
    movements: ["legPress", "legCurl", "legExtension", "calf", "adductor"],
    finisher: "plank",
    reserves: ["lunge", "hipThrust", "rdl", "plank"],
  },
  upperHyper: {
    label: { pt: "Upper · Hipertrofia", en: "Upper · Hypertrophy" },
    movements: ["inclinePress", "pulldown", "lateralRaise", "inclineCurl", "tricepsRope"],
    finisher: "plank",
    reserves: ["row", "facePull", "hammer", "plank"],
  },
  lowerHyper: {
    label: { pt: "Lower · Hipertrofia", en: "Lower · Hypertrophy" },
    movements: ["squat", "hipThrust", "legCurl", "legExtension", "calf"],
    finisher: "plank",
    reserves: ["lunge", "adductor", "rdl", "plank"],
  },
  fullBody: {
    label: { pt: "Corpo inteiro", en: "Full body" },
    movements: ["squat", "bench", "row", "lateralRaise", "curl"],
    finisher: "plank",
    reserves: ["rdl", "ohp", "tricepsRope", "plank"],
  },
  armsShoulders: {
    label: { pt: "Braços e Ombros", en: "Arms and Shoulders" },
    movements: ["lateralRaise", "facePull", "curl", "tricepsRope", "hammer"],
    finisher: "plank",
    reserves: ["arnold", "tricepsSkull", "inclineCurl", "plank"],
  },
} satisfies Record<string, Session>;

type SessionId = keyof typeof SESSIONS;

/**
 * Which sessions a week holds, by how many days someone actually trains.
 *
 * Six is the ceiling even for someone who says seven. The guide is blunt about
 * it: the training is the stimulus, the growth happens in the rest, and a plan
 * that ignores that is not a harder plan, it is a worse one.
 */
const SPLITS: Record<number, SessionId[]> = {
  1: ["fullBody"],
  2: ["upperStrength", "lowerStrength"],
  3: ["push", "pull", "legs"],
  4: ["upperStrength", "lowerStrength", "upperHyper", "lowerHyper"],
  5: ["upperStrength", "lowerStrength", "pull", "push", "legs"],
  6: ["upperStrength", "lowerStrength", "pull", "push", "legs", "armsShoulders"],
};

// ─── Dosage ───────────────────────────────────────────────────────────────────
// Straight from the guide: 3 to 4 sets, 6 to 12 reps on compounds, 10 to 20 on
// isolation, and the weekly record to beat.

function exerciseCount(sessionMinutes: number | null, level: Level): number {
  const byTime = sessionMinutes === null ? 5 : sessionMinutes <= 30 ? 4 : sessionMinutes <= 45 ? 5 : sessionMinutes <= 60 ? 5 : 6;
  // Someone in their first six months gets fewer, better executed movements.
  return level === "beginner" ? Math.min(byTime, 5) : byTime;
}

function setsFor(isCompound: boolean, level: Level, position: number): number {
  if (level === "beginner") return 3;
  // Four sets belong to the two movements the session is built around. Giving
  // every compound four turns a five compound lower day into twenty heavy sets.
  return isCompound && position < 2 ? 4 : 3;
}

function repsFor(isCompound: boolean, movementId: MovementId): string {
  if (movementId === "plank") return "40-60s";
  return isCompound ? "6-12" : "10-20";
}

const NOTES = {
  firstCompound: {
    pt: "O exercício a bater esta semana. Regista o peso: o objetivo é mais uma repetição, ou mais 2,5kg, do que da última vez.",
    en: "This week's benchmark. Log the weight: the aim is one more rep, or 2.5kg more, than last time.",
  },
  compound: {
    pt: "Descida controlada, 2 a 3 segundos. Para 1 a 2 repetições antes da falha.",
    en: "Controlled descent, 2 to 3 seconds. Stop 1 to 2 reps short of failure.",
  },
  isolation: {
    pt: "Amplitude máxima e descida lenta. Aqui a tensão vale mais do que o peso.",
    en: "Full range, slow descent. Tension matters more than load here.",
  },
  isolationBodyweight: {
    pt: "Amplitude máxima e descida lenta. Se não chegares às repetições, faz o máximo com execução limpa.",
    en: "Full range, slow descent. If the rep target is out of reach, do as many as you can with clean form.",
  },
  core: {
    pt: "Abdominal contraído, sem deixar cair a lombar.",
    en: "Brace hard, do not let the lower back sag.",
  },
  restDay: {
    pt: "Descanso, recuperação ativa",
    en: "Rest, active recovery",
  },
  restDayCut: {
    pt: "Descanso, 20 a 30 min de caminhada",
    en: "Rest, 20 to 30 min walk",
  },
} as const;

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * The weekdays to train. The quiz normally gives the exact days someone picked;
 * when it does not, fall back to a sensible spread that keeps rest between hard
 * sessions rather than stacking them Monday to Thursday.
 */
const SPREAD: Record<number, number[]> = {
  1: [3],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
};

function chosenDays(input: BasePlanInput): number[] {
  const picked = [...new Set(input.trainingDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
  if (picked.length > 0) {
    // Monday first, so the week reads the way the app shows it.
    const ordered = picked.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    return ordered.slice(0, 6);
  }
  const count = Math.min(Math.max(input.daysPerWeek ?? 3, 1), 6);
  return SPREAD[count];
}

function nameFor(id: MovementId, equipment: Equipment | null, lang: Lang): string {
  const movement = M[id] as Movement;
  const swap = equipment ? movement.swaps?.[equipment] : undefined;
  return (swap ?? movement)[lang];
}

function restLabelFor(input: BasePlanInput): string {
  const lang = input.lang;
  return input.goal === "lose_weight" ? NOTES.restDayCut[lang] : NOTES.restDay[lang];
}

/** The plan a person gets the moment the account exists. */
export function buildBasePlan(input: BasePlanInput): BasePlan {
  const lang = input.lang;
  const level = input.level ?? "beginner";
  const equipment = input.equipment ?? "gym_full";
  const days = chosenDays(input);
  const split = SPLITS[days.length] ?? SPLITS[3];
  const perSession = exerciseCount(input.sessionMinutes, level);

  const bodyweightOnly = equipment === "home_none" || equipment === "outdoor";

  // Monday-first position, so "before today" means earlier in the training
  // week rather than a smaller day number.
  const position = (d: number) => (d + 6) % 7;
  const startsAt = typeof input.startOnWeekday === "number" ? position(input.startOnWeekday) : null;

  const trainingDays: BasePlanDay[] = days.map((dayOfWeek, i) => {
    const session = SESSIONS[split[i % split.length]] as Session;
    const wanted: MovementId[] = session.movements.slice(0, perSession);
    if (perSession > session.movements.length) wanted.push(session.finisher);

    // Resolve names first and keep the session free of repeats: two different
    // movements can swap down to the same exercise once the equipment is gone.
    const taken = new Set<string>();
    const chosen: { id: MovementId; name: string }[] = [];
    const queue = [...wanted, ...session.reserves];
    for (const id of queue) {
      if (chosen.length >= wanted.length) break;
      const name = nameFor(id, equipment, lang);
      if (taken.has(name)) continue;
      taken.add(name);
      chosen.push({ id, name });
    }

    // Heavy first. A stand-in pulled from the reserves can otherwise land after
    // the isolation work, which is the one ordering rule nobody breaks twice.
    const ordered = [
      ...chosen.filter((c) => (M[c.id] as Movement).compound === true),
      ...chosen.filter((c) => (M[c.id] as Movement).compound !== true),
    ];

    const exercises: BasePlanExercise[] = ordered.map(({ id, name }, index) => {
      const movement = M[id] as Movement;
      const isCompound = movement.compound === true;
      const note =
        id === "plank" ? NOTES.core[lang]
        : index === 0 ? NOTES.firstCompound[lang]
        : isCompound ? NOTES.compound[lang]
        : bodyweightOnly ? NOTES.isolationBodyweight[lang]
        : NOTES.isolation[lang];

      return {
        name,
        sets: setsFor(isCompound, level, index),
        reps: repsFor(isCompound, id),
        notes: note,
        order_index: index,
      };
    });

    const alreadyPast = startsAt !== null && position(dayOfWeek) < startsAt;

    return {
      day_of_week: dayOfWeek,
      label: alreadyPast ? restLabelFor(input) : session.label[lang],
      is_rest: alreadyPast,
      order_index: i,
      exercises: alreadyPast ? [] : exercises,
    };
  });

  const restLabel = restLabelFor(input);
  const restDays: BasePlanDay[] = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => !days.includes(d))
    .map((d, i) => ({
      day_of_week: d,
      label: restLabel,
      is_rest: true,
      order_index: trainingDays.length + i,
      exercises: [],
    }));

  return {
    name: lang === "en" ? "KRAV Base Plan" : "Plano Base KRAV",
    days: [...trainingDays, ...restDays],
  };
}

/**
 * The names this generator gives its plans, in both languages.
 *
 * The app uses them to tell a base plan apart from one the coach wrote, so it
 * can say which is which on screen. Changing a name here without changing the
 * plans already in the database would make old ones read as coach-written,
 * which is the one thing this label exists to prevent.
 */
export const BASE_PLAN_NAMES = ["Plano Base KRAV", "KRAV Base Plan"] as const;

export function isBasePlan(planName: string | null | undefined): boolean {
  return typeof planName === "string" && (BASE_PLAN_NAMES as readonly string[]).includes(planName.trim());
}
