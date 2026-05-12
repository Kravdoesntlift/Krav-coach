"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import QuickMessage from "./QuickMessage";

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  active:    { label: "Ativo",     dot: "bg-green-400" },
  paused:    { label: "Pausado",   dot: "bg-yellow-400" },
  cancelled: { label: "Cancelado", dot: "bg-red-400" },
};

const ENERGY_EMOJI = ["", "😴", "😪", "😐", "💪", "⚡"];
const SLEEP_EMOJI  = ["", "😵", "😞", "😐", "😊", "🌙"];
const STRESS_EMOJI = ["", "🧘", "😌", "😐", "😤", "🤯"];

export interface ClientData {
  id: string;
  full_name: string;
  status: string;
  avatar_url?: string | null;
  subscription_renews_at?: string | null;
  // This week (optional — only present if client has a plan this week)
  totalDays?: number;
  completedDays?: number;
  checkin?: { energy_level: number | null; sleep_quality: number | null; stress_level: number | null } | null;
  // Computed
  unread: number;
  needsAttention: boolean;
  renewsSoon: boolean;
}

interface Props {
  clients: ClientData[];
  coachId: string;
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-700"
      />
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-black shrink-0"
      style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.65),rgba(168,137,58,0.45))", border: "1px solid rgba(201,168,76,0.2)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CoachClientList({ clients, coachId }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.full_name.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <section>
      {/* Header + search */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-white font-semibold">
          Clientes
          <span className="ml-2 text-zinc-600 font-normal text-sm">{clients.length}</span>
        </h2>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cliente..."
            className="pl-8 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-zinc-500 text-sm">Nenhum cliente encontrado para "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((client) => {
            const pct = client.totalDays && client.totalDays > 0
              ? Math.round(((client.completedDays ?? 0) / client.totalDays) * 100)
              : null;
            const statusCfg = STATUS_LABEL[client.status ?? "active"] ?? STATUS_LABEL.active;

            return (
              <div key={client.id} className="relative">
                <Link
                  href={`/coach/clients/${client.id}`}
                  className="card p-4 flex items-center gap-3 hover:border-zinc-700/80 hover:shadow-card transition-all group block"
                >
                  {/* Avatar + unread badge */}
                  <div className="relative shrink-0">
                    <Avatar name={client.full_name} avatarUrl={client.avatar_url} />
                    {client.unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-black text-[9px] font-black flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}
                      >
                        {client.unread > 9 ? "9+" : client.unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white font-medium text-sm truncate">{client.full_name}</p>
                      {client.needsAttention && client.status !== "cancelled" && (
                        <span className="text-[9px] bg-yellow-900/40 text-yellow-400 border border-yellow-700/40 px-1.5 py-0.5 rounded-full shrink-0">
                          Sem check-in
                        </span>
                      )}
                      {client.renewsSoon && (
                        <span className="text-[9px] bg-orange-900/40 text-orange-400 border border-orange-700/40 px-1.5 py-0.5 rounded-full shrink-0">
                          Renova em breve
                        </span>
                      )}
                    </div>

                    {/* Progress bar (only if has plan this week) */}
                    {pct !== null ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-400" : "bg-brand-gold"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          {client.completedDays}/{client.totalDays}
                        </span>
                        {client.checkin && (
                          <span className="text-xs">
                            {client.checkin.energy_level  ? ENERGY_EMOJI[client.checkin.energy_level]  : ""}
                            {client.checkin.sleep_quality ? SLEEP_EMOJI[client.checkin.sleep_quality]  : ""}
                            {client.checkin.stress_level  ? STRESS_EMOJI[client.checkin.stress_level]  : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-700 text-[10px] mt-1">Sem plano esta semana</p>
                    )}
                  </div>

                  {/* Status + arrow */}
                  <div className="flex items-center gap-2 shrink-0 pr-8">
                    <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} title={statusCfg.label} />
                    <span className="text-zinc-700 group-hover:text-zinc-400 text-xs transition-colors">→</span>
                  </div>
                </Link>

                {/* Quick message — outside Link */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <QuickMessage coachId={coachId} clientId={client.id} clientName={client.full_name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
