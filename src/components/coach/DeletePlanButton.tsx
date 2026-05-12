"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  planId: string;
  clientId: string;
  deletePlan: (planId: string, clientId: string) => Promise<{ error?: string; success?: boolean }>;
}

export default function DeletePlanButton({ planId, clientId, deletePlan }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await deletePlan(planId, clientId);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Tens a certeza?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Apagar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-600 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
    >
      Apagar
    </button>
  );
}
