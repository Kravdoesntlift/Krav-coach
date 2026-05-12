"use client";

import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  current: string;
  options: string[];
  monthNames: string[];
}

export default function CoachMonthPicker({ clientId, current, options, monthNames }: Props) {
  const router = useRouter();
  const base = `/coach/clients/${clientId}/report`;

  function label(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    return `${monthNames[m - 1]} ${y}`;
  }

  const idx = options.indexOf(current);
  const hasPrev = idx < options.length - 1;
  const hasNext = idx > 0;

  return (
    <div className="no-print flex items-center justify-center gap-4 mb-4">
      <button
        onClick={() => hasPrev && router.push(`${base}?m=${options[idx + 1]}`)}
        disabled={!hasPrev}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ‹
      </button>
      <span className="text-white font-semibold text-sm min-w-[140px] text-center">
        {label(current)}
      </span>
      <button
        onClick={() => hasNext && router.push(`${base}?m=${options[idx - 1]}`)}
        disabled={!hasNext}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ›
      </button>
    </div>
  );
}
