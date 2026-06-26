"use client";

import { useState } from "react";

interface Props {
  planId: string;
  duplicatePlan: (planId: string) => Promise<void | { error?: string }>;
}

export default function DuplicatePlanButton({ planId, duplicatePlan }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    const result = await duplicatePlan(planId);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return <span className="text-xs text-green-500 px-3 py-1.5">Duplicado ✓</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handle}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Duplicar para próx. semana"}
      </button>
      {error && <span className="text-xs text-red-400 px-3">{error}</span>}
    </div>
  );
}
