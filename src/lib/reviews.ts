/** Shared by the carousel (client) and the score badge (server). */

/** A five-point star on a 20×20 grid. */
export const STAR_PATH =
  "M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z";

/** "Guilherme Nunes" → "GN", "Constança P" → "CP", "Rui" → "R". */
export function initialsOf(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (parts[0][0] + last).toUpperCase();
}
