"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { acknowledgeAlert, undoAcknowledgeAlert } from "@/app/coach/alerts/actions";

interface Alert {
  type: "no_checkin" | "renewal" | "overdue_renewal" | "no_completion" | "perfect_week" | "pr_week" | "at_risk";
  clientId: string;
  clientName: string;
  detail: string;
  urgency: "high" | "medium" | "low";
  /** The week, or the renewal date, this alert is about. */
  context: string;
}

interface Props {
  alerts: Alert[];
  handled?: Alert[];
}

const ALERT_CONFIG = {
  no_checkin:       { icon: "⚠️",  color: "text-yellow-400", border: "border-yellow-700/40", bg: "bg-yellow-950/20" },
  renewal:          { icon: "💳",  color: "text-orange-400", border: "border-orange-700/40", bg: "bg-orange-950/20" },
  overdue_renewal:  { icon: "🔴",  color: "text-red-400",    border: "border-red-700/40",    bg: "bg-red-950/20"    },
  no_completion:    { icon: "🏋",  color: "text-blue-400",   border: "border-blue-700/40",   bg: "bg-blue-950/20"   },
  perfect_week:     { icon: "🏆",  color: "text-green-400",  border: "border-green-700/40",  bg: "bg-green-950/20"  },
  pr_week:          { icon: "📈",  color: "text-brand-gold", border: "border-brand-gold/30", bg: "bg-yellow-950/10" },
  at_risk:          { icon: "🚨",  color: "text-red-400",    border: "border-red-700/40",    bg: "bg-red-950/20"    },
};

/** What comes back, and when, once an alert is ticked off. */
const RETURNS: Record<Alert["type"], string> = {
  no_checkin:      "Volta para a semana que vem se continuar sem check-in.",
  renewal:         "Volta na próxima renovação.",
  overdue_renewal: "Volta enquanto o pagamento continuar recusado, na próxima data.",
  no_completion:   "Volta para a semana que vem se continuar sem treinos.",
  perfect_week:    "Volta se voltar a fazer semana perfeita.",
  pr_week:         "Volta se fizer novos PRs noutra semana.",
  at_risk:         "Volta para a semana que vem se o cenário se mantiver.",
};

const MAX_COLLAPSED = 3;

function keyOf(a: Alert) {
  return `${a.clientId}|${a.type}|${a.context}`;
}

export default function SmartAlerts({ alerts, handled = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showHandled, setShowHandled] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Hidden here the moment the button is pressed, so twenty of these in a row
  // do not each wait for a round trip.
  const [justHandled, setJustHandled] = useState<Set<string>>(new Set());
  const [justRestored, setJustRestored] = useState<Set<string>>(new Set());

  const open = alerts.filter((a) => !justHandled.has(keyOf(a)));
  const done = [
    ...handled.filter((a) => !justRestored.has(keyOf(a))),
    ...alerts.filter((a) => justHandled.has(keyOf(a))),
  ];

  function markHandled(alert: Alert) {
    const key = keyOf(alert);
    setError(null);
    setJustHandled((prev) => new Set(prev).add(key));
    startTransition(async () => {
      const result = await acknowledgeAlert({
        clientId: alert.clientId,
        alertType: alert.type,
        context: alert.context,
      }).catch((): { ok: false; error: string } => ({
        ok: false,
        error: "Não foi possível falar com o servidor.",
      }));
      if (!result.ok) {
        // Put it back: a row that vanishes without being saved is the bug this
        // whole feature exists to avoid.
        setJustHandled((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setError(result.error);
      }
    });
  }

  function restore(alert: Alert) {
    const key = keyOf(alert);
    setError(null);
    setJustRestored((prev) => new Set(prev).add(key));
    setJustHandled((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    startTransition(async () => {
      const result = await undoAcknowledgeAlert({
        clientId: alert.clientId,
        alertType: alert.type,
        context: alert.context,
      }).catch((): { ok: false; error: string } => ({
        ok: false,
        error: "Não foi possível falar com o servidor.",
      }));
      if (!result.ok) setError(result.error);
    });
  }

  if (!alerts.length && !handled.length) return null;

  const high = open.filter((a) => a.urgency === "high");
  const rest = open.filter((a) => a.urgency !== "high");
  const sorted = [...high, ...rest];
  const visible = expanded ? sorted : sorted.slice(0, MAX_COLLAPSED);
  const hidden = sorted.length - MAX_COLLAPSED;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-white font-semibold">Alertas</h2>
        {high.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
            {high.length} urgente{high.length !== 1 ? "s" : ""}
          </span>
        )}
        <span className="text-xs text-zinc-600 ml-auto">
          {sorted.length} por tratar
        </span>
      </div>

      {error && (
        <p
          className="mb-3 rounded-xl px-3 py-2.5 text-xs leading-relaxed"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          {error}
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 px-4 py-5 text-center text-xs text-zinc-500">
          Tudo tratado. Os alertas voltam sozinhos quando a situação mudar.
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => {
            const cfg = ALERT_CONFIG[alert.type];
            return (
              <div
                key={keyOf(alert)}
                className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} transition-opacity`}
              >
                <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
                <Link href={`/coach/clients/${alert.clientId}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className={`text-sm font-semibold ${cfg.color}`}>{alert.clientName}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{alert.detail}</p>
                </Link>
                <button
                  onClick={() => markHandled(alert)}
                  disabled={isPending}
                  title={RETURNS[alert.type]}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#a1a1aa",
                  }}
                >
                  ✓ Tratado
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Expand / collapse */}
      {sorted.length > MAX_COLLAPSED && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 hover:border-zinc-700"
        >
          {expanded ? "Ver menos ▲" : `Ver mais ${hidden} alerta${hidden !== 1 ? "s" : ""} ▼`}
        </button>
      )}

      {/* Handled: kept in view, one click from coming back */}
      {done.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHandled((v) => !v)}
            className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showHandled ? "Esconder tratados ▲" : `Tratados (${done.length}) ▼`}
          </button>

          {showHandled && (
            <div className="space-y-2 mt-1">
              {done.map((alert) => (
                <div
                  key={keyOf(alert)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/70 bg-zinc-900/30"
                >
                  <span className="text-base shrink-0 mt-0.5 opacity-40">{ALERT_CONFIG[alert.type].icon}</span>
                  <Link href={`/coach/clients/${alert.clientId}`} className="flex-1 min-w-0 hover:opacity-80">
                    <p className="text-sm font-semibold text-zinc-400">{alert.clientName}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{alert.detail}</p>
                    <p className="text-zinc-700 text-[11px] mt-1">{RETURNS[alert.type]}</p>
                  </Link>
                  <button
                    onClick={() => restore(alert)}
                    disabled={isPending}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Repor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
