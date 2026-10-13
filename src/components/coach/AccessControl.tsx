"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setClientAccessAction, type AccessActionState } from "@/app/coach/clients/access-actions";

function Choice({ choice, label }: { choice: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="choice"
      value={choice}
      disabled={pending}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}

/**
 * Free access for somebody who is not paying: a friend testing, a client
 * between subscriptions, a case the coach decided on his own.
 *
 * It states what the person has right now in words, because "trial_ends_at"
 * is a column name and "acesso até 11 de outubro de 2027" is an answer.
 */
export default function AccessControl({
  clientId,
  hasLiveSubscription,
  trialEndsAt,
}: {
  clientId: string;
  hasLiveSubscription: boolean;
  trialEndsAt: string | null;
}) {
  const [state, action] = useActionState<AccessActionState, FormData>(
    setClientAccessAction,
    { ok: false, message: null },
  );

  const until = trialEndsAt ? new Date(trialEndsAt) : null;
  const active = until !== null && until.getTime() > Date.now();
  const formatted = until
    ? until.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const current = hasLiveSubscription
    ? "Tem subscrição ativa, o acesso vem daí."
    : active
    ? `Acesso grátis até ${formatted}.`
    : until
    ? `Sem acesso. O último terminou a ${formatted}.`
    : "Sem acesso grátis definido.";

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black tracking-[0.14em] uppercase text-zinc-500">Acesso à app</p>
        <p className="text-sm text-gray-300">{current}</p>
      </div>

      {!hasLiveSubscription && (
        <form action={action} className="space-y-2">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="flex flex-wrap gap-2">
            <Choice choice="1" label={active ? "+1 mês" : "1 mês"} />
            <Choice choice="3" label={active ? "+3 meses" : "3 meses"} />
            <Choice choice="12" label={active ? "+1 ano" : "1 ano"} />
            {active && <Choice choice="end" label="Terminar" />}
          </div>
          {state.message && (
            <p className="text-xs" style={{ color: state.ok ? "#4ade80" : "#fca5a5" }}>
              {state.message}
            </p>
          )}
        </form>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Acesso dado à mão não cobra nada a ninguém e não aparece na faturação. A app escreve os
        treinos dele na mesma, como num trial.
      </p>
    </div>
  );
}
