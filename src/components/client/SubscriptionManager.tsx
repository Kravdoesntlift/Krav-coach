"use client";

import { useState, useTransition } from "react";

interface Props {
  hasSubscription: boolean;
  status: string | null;
  renewsAt: string | null;
  amountCents: number | null;
}

export default function SubscriptionManager({ hasSubscription, status, renewsAt, amountCents }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error ?? "Erro ao abrir portal.");
          return;
        }
        window.open(data.url, "_blank");
      } catch {
        setError("Erro de ligação. Tenta novamente.");
      }
    });
  }

  if (!hasSubscription) return null;

  const statusLabel: Record<string, { label: string; color: string }> = {
    active:   { label: "Ativa",           color: "text-green-400" },
    past_due: { label: "Pagamento em atraso", color: "text-orange-400" },
    cancelled:{ label: "Cancelada",       color: "text-red-400" },
    canceled: { label: "Cancelada",       color: "text-red-400" },
    trialing: { label: "Período de teste", color: "text-blue-400" },
  };

  const s = status ? (statusLabel[status] ?? { label: status, color: "text-zinc-400" }) : null;

  const amount = amountCents
    ? new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(amountCents / 100)
    : null;

  const renews = renewsAt
    ? new Date(renewsAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(18,18,22,0.8)", border: "1px solid rgba(39,39,42,0.6)" }}>
      <h2 className="text-white font-bold text-base">Subscrição</h2>

      <div className="space-y-2">
        {s && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Estado</span>
            <span className={`font-semibold ${s.color}`}>{s.label}</span>
          </div>
        )}
        {amount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Valor</span>
            <span className="text-white font-semibold">{amount}/mês</span>
          </div>
        )}
        {renews && status !== "cancelled" && status !== "canceled" && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Próxima renovação</span>
            <span className="text-zinc-300">{renews}</span>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={openPortal}
        disabled={isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all disabled:opacity-50"
      >
        {isPending ? "A abrir..." : "Gerir subscrição"}
      </button>
      <p className="text-zinc-600 text-xs text-center">
        Podes cancelar ou atualizar o método de pagamento a qualquer momento.
      </p>
    </div>
  );
}
