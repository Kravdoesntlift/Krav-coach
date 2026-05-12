"use client";

import { useState } from "react";

interface Props {
  planId: string;
  duplicatePlan: (planId: string) => Promise<void | { error?: string }>;
}

export default function DuplicatePlanButton({ planId, duplicatePlan }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await duplicatePlan(planId);
    // redirect happens inside the action
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Duplicar para próx. semana"}
    </button>
  );
}
