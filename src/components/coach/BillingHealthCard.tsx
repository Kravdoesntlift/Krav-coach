"use client";

import { useState, useTransition } from "react";
import { syncBillingAction, type SyncResult } from "@/app/coach/billing/actions";

interface Props {
  /** null when no event has ever arrived. */
  lastEventAt: string | null;
  healthy: boolean;
  neverReceived: boolean;
  hasSubscriptions: boolean;
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

export default function BillingHealthCard({
  lastEventAt,
  healthy,
  neverReceived,
  hasSubscriptions,
}: Props) {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSync() {
    setResult(null);
    startTransition(async () => setResult(await syncBillingAction()));
  }

  const ok = healthy || !hasSubscriptions;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: ok ? "rgba(18,18,20,0.8)" : "rgba(69,26,3,0.35)",
        border: `1px solid ${ok ? "rgba(39,39,42,0.6)" : "rgba(249,115,22,0.35)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-green-400" : "bg-orange-400"}`}
            />
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Ligação ao Stripe
            </p>
          </div>

          {ok ? (
            <p className="text-sm text-zinc-300">
              {lastEventAt
                ? <>A receber pagamentos em tempo real. Último evento {relativeTime(lastEventAt)}.</>
                : <>Sem subscrições ainda, nada para sincronizar.</>}
            </p>
          ) : (
            <p className="text-sm text-orange-200 leading-relaxed">
              {neverReceived
                ? "O Stripe nunca conseguiu entregar um evento a esta app."
                : `Sem eventos do Stripe há ${relativeTime(lastEventAt!).replace("há ", "")}.`}{" "}
              Os pagamentos continuam a ser cobrados e a app corrige-se sozinha todas as
              noites, mas as renovações só aparecem no dia seguinte.
            </p>
          )}
        </div>

        <button
          onClick={runSync}
          disabled={isPending}
          className="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "A sincronizar…" : "Sincronizar agora"}
        </button>
      </div>

      {!ok && (
        <div className="rounded-xl p-3 text-xs leading-relaxed text-zinc-400 bg-black/30 border border-zinc-800">
          <span className="text-zinc-300 font-semibold">Como corrigir:</span> no Stripe, em
          Developers → Webhooks, confirma que o URL do destino é exactamente{" "}
          <code className="text-zinc-200">https://www.kravcoaching.com/api/stripe/webhook</code>{" "}
, com <span className="text-zinc-200 font-semibold">www</span>. Sem ele o Stripe
          apanha um redireccionamento e marca a entrega como falhada.
        </div>
      )}

      {result && (
        <p className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
