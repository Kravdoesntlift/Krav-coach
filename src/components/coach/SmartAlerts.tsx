"use client";

import Link from "next/link";
import { useState } from "react";

interface Alert {
  type: "no_checkin" | "renewal" | "overdue_renewal" | "no_completion" | "perfect_week" | "pr_week" | "at_risk";
  clientId: string;
  clientName: string;
  detail: string;
  urgency: "high" | "medium" | "low";
}

interface Props {
  alerts: Alert[];
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

const MAX_COLLAPSED = 3;

export default function SmartAlerts({ alerts }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!alerts.length) return null;

  const high   = alerts.filter((a) => a.urgency === "high");
  const rest   = alerts.filter((a) => a.urgency !== "high");
  const sorted = [...high, ...rest];
  const visible = expanded ? sorted : sorted.slice(0, MAX_COLLAPSED);
  const hidden  = sorted.length - MAX_COLLAPSED;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-white font-semibold">Alertas</h2>
        {high.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
            {high.length} urgente{high.length !== 1 ? "s" : ""}
          </span>
        )}
        <span className="text-xs text-zinc-600 ml-auto">{sorted.length} total</span>
      </div>

      <div className="space-y-2">
        {visible.map((alert, i) => {
          const cfg = ALERT_CONFIG[alert.type];
          return (
            <Link
              key={i}
              href={`/coach/clients/${alert.clientId}`}
              className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg} hover:opacity-80 transition-opacity`}
            >
              <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${cfg.color}`}>{alert.clientName}</p>
                <p className="text-gray-400 text-xs mt-0.5">{alert.detail}</p>
              </div>
              <span className="text-gray-600 text-xs shrink-0 mt-0.5">→</span>
            </Link>
          );
        })}
      </div>

      {/* Expand / collapse */}
      {sorted.length > MAX_COLLAPSED && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 hover:border-zinc-700"
        >
          {expanded
            ? "Ver menos ▲"
            : `Ver mais ${hidden} alerta${hidden !== 1 ? "s" : ""} ▼`}
        </button>
      )}
    </section>
  );
}
