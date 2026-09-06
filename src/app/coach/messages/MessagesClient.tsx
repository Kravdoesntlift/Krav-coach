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

// Generates a consistent gold-toned gradient from a UUID
function avatarGradient(id: string) {
  // Use last 6 chars of UUID as a simple hash
  const h = parseInt(id.replace(/-/g, "").slice(-6), 16) % 360;
  const palettes = [
    "linear-gradient(135deg,#E2C060,#A8893A)", // gold
    "linear-gradient(135deg,#6EE7B7,#059669)", // green
    "linear-gradient(135deg,#93C5FD,#3B82F6)", // blue
    "linear-gradient(135deg,#F9A8D4,#EC4899)", // pink
    "linear-gradient(135deg,#FCA5A5,#EF4444)", // red
    "linear-gradient(135deg,#C4B5FD,#8B5CF6)", // purple
    "linear-gradient(135deg,#FCD34D,#F59E0B)", // amber
    "linear-gradient(135deg,#6EE7F7,#0891B2)", // cyan
  ];
  return palettes[parseInt(id.replace(/-/g, "").slice(-2), 16) % palettes.length];
}

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

  // Detect duplicate names to show extra identifier
  const nameCounts = convos.reduce<Record<string, number>>((acc, c) => {
    acc[c.clientName] = (acc[c.clientName] ?? 0) + 1;
    return acc;
  }, {});

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
          {filtered.map((c) => {
            const isDuplicate = (nameCounts[c.clientName] ?? 0) > 1;
            const shortId = c.clientId.slice(-4).toUpperCase();

            return (
              <div
                key={c.clientId}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                style={{
                  background: c.unread > 0
                    ? "linear-gradient(135deg,rgba(201,168,76,0.05),rgba(10,10,10,0.9))"
                    : "rgba(18,18,20,0.8)",
                  border: c.unread > 0
                    ? "1px solid rgba(201,168,76,0.22)"
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
                      style={{ background: avatarGradient(c.clientId) }}
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

                {/* Content: links to chat */}
                <Link
                  href={`/coach/clients/${c.clientId}/chat`}
                  className="flex-1 min-w-0 group"
                >
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${c.unread > 0 ? "text-white" : "text-zinc-300"}`}>
                      {c.clientName}
                    </p>
                    {isDuplicate && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 shrink-0">
                        #{shortId}
                      </span>
                    )}
                    <span className="ml-auto text-zinc-600 text-[10px] shrink-0">{formatRelative(c.lastAt)}</span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${c.unread > 0 ? "text-zinc-400" : "text-zinc-600"}`}>
                    {c.hasMessages
                      ? (c.lastMessage || "-")
                      : <span className="italic text-zinc-700">Sem mensagens, clica para iniciar</span>
                    }
                  </p>
                </Link>

                {/* Profile quick-access button */}
                <Link
                  href={`/coach/clients/${c.clientId}`}
                  title="Ver perfil completo"
                  className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-zinc-600 hover:text-brand-gold hover:bg-zinc-800 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
