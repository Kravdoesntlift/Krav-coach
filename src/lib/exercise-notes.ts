/**
 * Exercise notes are stored as plain lines so they stay readable wherever they
 * are shown raw (coach view, PDF export, a plain textarea). This is the single
 * place that turns them back into parts, so the note card and the live workout
 * screen can never disagree about what counts as an alternative.
 *
 *   Aquec. 2-3 séries · Descanso 3-5 min · RPE ~6-7 (última ~7-8)
 *   Última série até à falha
 *   1 segundo de pausa em baixo em cada repetição...
 *   Alternativas: Supino Inclinado com Halteres · Supino Inclinado na Máquina
 *
 * Anything unrecognised falls through as a cue, so a note written by hand still
 * renders sensibly instead of disappearing.
 */

export const INTENSITY_TECHNIQUES = [
  "Última série até à falha + LLPs (prolongar a série)",
  "Última série até à falha",
  "Última série em myo-reps",
  "Terminar com alongamento estático (30s)",
];

const PRESCRIPTION_PREFIX = "Aquec.";
const ALTERNATIVES_PREFIX = "Alternativas:";

export interface ParsedNote {
  /** Warm-up / rest / RPE, already split into display chips. */
  chips: string[];
  /** Last-set intensity technique, if the note names one. */
  technique: string | null;
  /** Coaching cues, in the order written. */
  cues: string[];
  /** Coach-approved substitutions for this exercise. */
  alternatives: string[];
}

export function parseExerciseNote(notes: string | null | undefined): ParsedNote {
  const empty: ParsedNote = { chips: [], technique: null, cues: [], alternatives: [] };
  if (!notes) return empty;

  const lines = notes.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return empty;

  const prescription = lines.find((l) => l.startsWith(PRESCRIPTION_PREFIX));
  const technique = lines.find((l) => INTENSITY_TECHNIQUES.includes(l)) ?? null;
  const altLine = lines.find((l) => l.startsWith(ALTERNATIVES_PREFIX));

  return {
    chips: prescription ? splitOnMiddot(prescription) : [],
    technique,
    cues: lines.filter((l) => l !== prescription && l !== technique && l !== altLine),
    alternatives: altLine
      ? splitOnMiddot(altLine.slice(ALTERNATIVES_PREFIX.length))
      : [],
  };
}

function splitOnMiddot(s: string): string[] {
  return s.split("·").map((p) => p.trim()).filter(Boolean);
}
