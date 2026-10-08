/**
 * Client transformations shown on the landing page.
 *
 * Three things matter here and none of them are technical.
 *
 * Every entry is a real person who gave permission for their photos to be
 * published. No stock images, no photos of the coach presented as a client,
 * and nothing lifted from a chat without being asked. A transformation that
 * cannot be backed by the person in it is worth less than no transformation,
 * because the first prospect who asks lands the whole site in doubt.
 *
 * The numbers are what actually happened, in the time it actually took. A
 * result with no timeframe reads as a result that took no time.
 *
 * The list is empty until the photos exist. The section disappears on its own
 * rather than rendering frames with nothing in them.
 */

export interface Transformation {
  /** First name, or "Cliente" when the person prefers not to be named. */
  name: string;
  /** Files under public/transformacoes. */
  before: string;
  after: string;
  /** The headline number, e.g. "67kg → 87kg". */
  result: string;
  /** How long it took, e.g. "14 meses". Never left vague. */
  duration: { pt: string; en: string };
  /** One line about what changed, in the coach's voice. */
  note: { pt: string; en: string };
}

export const TRANSFORMATIONS: Transformation[] = [];

export function hasTransformations(): boolean {
  return TRANSFORMATIONS.length > 0;
}
