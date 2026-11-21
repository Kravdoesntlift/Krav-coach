"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  current: string;        // "YYYY-MM"
  options: string[];      // ["YYYY-MM", ...]
  monthNames: string[];   // Portuguese month names
}

export default function MonthPicker({ current, options, monthNames }: Props) {
  const router = useRouter();

  function label(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    return `${monthNames[m - 1]} ${y}`;
  }

  // Rubber banding. A disabled arrow answers a tap with nothing at all, so
  // the only way to learn there are no earlier months is to give up. The
  // label resists and springs back instead, which says the same thing in the
  // language a thumb already speaks.
  const [bounce, setBounce] = useState(false);
  function resist() {
    setBounce(false);
    requestAnimationFrame(() => setBounce(true));
  }

  function prev() {
    const idx = options.indexOf(current);
    if (idx < options.length - 1) router.push(`/client/report?m=${options[idx + 1]}`);
    else resist();
  }
  function next() {
    const idx = options.indexOf(current);
    if (idx > 0) router.push(`/client/report?m=${options[idx - 1]}`);
    else resist();
  }

  const idx = options.indexOf(current);
  const hasPrev = idx < options.length - 1;
  const hasNext = idx > 0;

  return (
    <div className="no-print flex items-center justify-center gap-4 mb-4">
      <button
        onClick={prev}
        aria-disabled={!hasPrev}
        className="tap-44 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 aria-disabled:opacity-30 transition-colors duration-instant ease-standard squash"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span
        className={`text-white font-semibold text-sm min-w-[140px] text-center ${bounce ? "rubber-band" : ""}`}
        onAnimationEnd={() => setBounce(false)}
      >
        {label(current)}
      </span>
      <button
        onClick={next}
        aria-disabled={!hasNext}
        className="tap-44 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 aria-disabled:opacity-30 transition-colors duration-instant ease-standard squash"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
