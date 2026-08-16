"use client";

import { useState } from "react";

/**
 * Renders a structured exercise note.
 *
 * Notes are written as plain lines so they stay readable anywhere they are shown
 * raw (coach view, PDF export). This splits them back into their parts:
 *
 *   Aquec. 2-3 séries · Descanso 3-5 min · RPE ~6-7 (última ~7-8)
 *   Última série até à falha
 *   1 segundo de pausa em baixo em cada repetição...
 *   Alternativas: Supino Inclinado com Halteres · Supino Inclinado na Máquina
 *
 * Anything unrecognised falls through as body text, so a note that does not
 * follow the convention still renders sensibly instead of disappearing.
 */

const TECHNIQUES = [
  "Última série até à falha + LLPs (prolongar a série)",
  "Última série até à falha",
  "Última série em myo-reps",
  "Terminar com alongamento estático (30s)",
];

export default function ExerciseNotes({ notes, compact = false }: { notes: string; compact?: boolean }) {
  const [showAlts, setShowAlts] = useState(false);

  const lines = notes.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const prescription = lines.find((l) => l.startsWith("Aquec."));
  const technique = lines.find((l) => TECHNIQUES.includes(l));
  const altLine = lines.find((l) => l.startsWith("Alternativas:"));
  const cues = lines.filter((l) => l !== prescription && l !== technique && l !== altLine);

  const chips = prescription ? prescription.split("·").map((s) => s.trim()).filter(Boolean) : [];
  const alts = altLine
    ? altLine.replace(/^Alternativas:\s*/, "").split("·").map((s) => s.trim()).filter(Boolean)
    : [];

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
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
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
