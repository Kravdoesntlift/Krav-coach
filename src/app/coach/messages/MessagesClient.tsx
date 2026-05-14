"use client";

import { useState } from "react";
import Link from "next/link";

export type Convo = {
  clientId: string;
  clientName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
  hasMessages: boolean;
};

function formatRelative(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d`;
  return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export default function MessagesClient({ convos }: { convos: Convo[] }) {
  const [search, setSearch] = useState("");

  const filtered = convos.filter((c) =>
    c.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = convos.filter((c) => c.unread > 0).length;

  return (
    <div className="space-y-6 page-enter max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mensagens</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} conversa${unreadCount > 1 ? "s" : ""} por ler`
              : convos.length > 0 ? `${convos.length} cliente${convos.length > 1 ? "s" : ""}` : "Tudo em dia"}
          </p>
        </div>

        {/* Search */}
        {convos.length > 0 && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-gold/50 transition-colors w-44"
            />
          </div>
        )}
      </div>

      {convos.length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center"
          style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
        >
          <p className="text-4xl mb-4">💬</p>
          <p className="text-zinc-400 font-semibold">Nenhum cliente ainda</p>
          <p className="text-zinc-600 text-sm mt-1">
            Atribui clientes em{" "}
            <Link href="/coach/manage-clients" className="text-brand-gold hover:underline">
              Gerir Clientes
            </Link>{" "}
            para começar a conversar
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-600 text-sm text-center py-10">
          Nenhum cliente encontrado para &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.clientId}
              href={`/coach/clients/${c.clientId}/chat`}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
              style={{
                background: c.unread > 0
                  ? "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(10,10,10,0.9))"
                  : "rgba(18,18,20,0.8)",
                border: c.unread > 0
                  ? "1px solid rgba(201,168,76,0.2)"
                  : "1px solid rgba(39,39,42,0.5)",
              }}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.clientName}
                    className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-black text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
                  >
                    {c.clientName.charAt(0).toUpperCase()}
                  </div>
                )}
                {c.unread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-black"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}
                  >
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-semibold text-sm ${c.unread > 0 ? "text-white" : "text-zinc-300"}`}>
                    {c.clientName}
                  </p>
                  <span className="text-zinc-600 text-[10px] shrink-0">{formatRelative(c.lastAt)}</span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${c.unread > 0 ? "text-zinc-400" : "text-zinc-600"}`}>
                  {c.hasMessages
                    ? (c.lastMessage || "—")
                    : <span className="italic text-zinc-700">Sem mensagens ainda — clica para iniciar</span>
                  }
                </p>
              </div>

              {/* Arrow */}
              <span className="text-zinc-700 group-hover:text-zinc-400 text-xs shrink-0 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
