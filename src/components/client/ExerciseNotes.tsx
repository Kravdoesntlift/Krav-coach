"use client";

import { useState } from "react";
import { parseExerciseNote } from "@/lib/exercise-notes";

/**
 * Renders a structured exercise note: prescription as chips, the intensity
 * technique as a badge, cues as body text, and substitutions behind a toggle.
 *
 * `hideAlternatives` is for screens that offer swapping themselves: the live
 * workout lists them as buttons, so repeating them here would be noise.
 */
export default function ExerciseNotes({
  notes,
  compact = false,
  hideAlternatives = false,
  hideCues = false,
}: {
  notes: string;
  compact?: boolean;
  hideAlternatives?: boolean;
  /**
   * Drop the coaching cues. Sets, rest and RPE carry over to a substitute, but
   * the cue describes the planned movement: "start with the cable low" is wrong
   * once you've swapped a crossover for a pec deck.
   */
  hideCues?: boolean;
}) {
  const [showAlts, setShowAlts] = useState(false);
  const parsed = parseExerciseNote(notes);
  const { chips, technique, alternatives } = parsed;
  const cues = hideCues ? [] : parsed.cues;

  if (!chips.length && !technique && !cues.length && !alternatives.length) return null;
  const alts = hideAlternatives ? [] : alternatives;

  return (
    <div className={compact ? "space-y-1.5 mt-1" : "space-y-2 mt-1.5"}>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((c, i) => (
            <span
              key={i}
              className="text-[10px] leading-none px-2 py-1 rounded-md font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#a1a1aa",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {technique && (
        <div
          className="inline-flex items-center gap-1.5 text-[10px] leading-none px-2 py-1 rounded-md font-bold"
          style={{
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.28)",
            color: "#E8C96B",
          }}
        >
          <span aria-hidden>⚡</span>
          {technique}
        </div>
      )}

      {cues.map((c, i) => (
        <p key={i} className="text-zinc-400 text-xs leading-relaxed">
          {c}
        </p>
      ))}

      {alts.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAlts((v) => !v)}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
          >
            {showAlts ? "▾" : "▸"} Alternativas ({alts.length})
          </button>
          {showAlts && (
            <ul className="mt-1 space-y-0.5">
              {alts.map((a, i) => (
                <li key={i} className="text-[11px] text-zinc-500 pl-3">
                  · {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
