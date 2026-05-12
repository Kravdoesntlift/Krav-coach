"use client";

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

  function prev() {
    const idx = options.indexOf(current);
    if (idx < options.length - 1) router.push(`/client/report?m=${options[idx + 1]}`);
  }
  function next() {
    const idx = options.indexOf(current);
    if (idx > 0) router.push(`/client/report?m=${options[idx - 1]}`);
  }

  const idx = options.indexOf(current);
  const hasPrev = idx < options.length - 1;
  const hasNext = idx > 0;

  return (
    <div className="no-print flex items-center justify-center gap-4 mb-4">
      <button
        onClick={prev}
        disabled={!hasPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="text-white font-semibold text-sm min-w-[140px] text-center">
        {label(current)}
      </span>
      <button
        onClick={next}
        disabled={!hasNext}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}
