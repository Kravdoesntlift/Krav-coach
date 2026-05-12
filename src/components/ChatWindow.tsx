"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/supabase/types";

interface Props {
  currentUserId: string;
  currentUserName: string;
  otherUser: Pick<Profile, "id" | "full_name">;
  initialMessages: Message[];
}

export default function ChatWindow({ currentUserId, currentUserName, otherUser, initialMessages }: Props) {
  const router  = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Supabase Realtime — mensagens instantâneas ────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel(`chat:${[currentUserId, otherUser.id].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          // Only add if it's part of this conversation
          const isRelevant =
            (msg.sender_id === currentUserId && msg.receiver_id === otherUser.id) ||
            (msg.sender_id === otherUser.id  && msg.receiver_id === currentUserId);
          if (isRelevant) {
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, otherUser.id]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mark incoming as read ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const unread   = messages
      .filter((m) => m.receiver_id === currentUserId && !m.read_at)
      .map((m) => m.id);
    if (unread.length > 0) {
      supabase.from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread)
        .then(() => {
          router.refresh();
          // Clear OS-level app badge immediately after marking messages as read
          if ("clearAppBadge" in navigator) {
            (navigator as Navigator & { clearAppBadge: () => Promise<void> })
              .clearAppBadge().catch(() => {});
          }
        });
    }
  }, [messages, currentUserId, router]);

  // ── Send ──────────────────────────────────────────────────────────────────
  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setText("");

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .insert({ sender_id: currentUserId, receiver_id: otherUser.id, content: trimmed })
      .select()
      .single();

    if (data) setMessages((prev) => [...prev, data as Message]);

    // Push notification (best-effort)
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: otherUser.id,
        title: `💬 ${currentUserName}`,
        body: trimmed.slice(0, 100),
        url: "/client/chat",
      }),
    }).catch(() => {});

    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // ── Formatting ────────────────────────────────────────────────────────────
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  }
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
  }

  // Group by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const date = msg.created_at.split("T")[0];
    const last  = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  return (
    <div className="flex flex-col" style={{ height: "min(72dvh, 640px)" }}>

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center gap-3"
        style={{ background: "rgba(18,18,20,0.95)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0"
          style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
        >
          {otherUser.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{otherUser.full_name}</p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: "#0a0a0a" }}>
        {grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-700 text-sm">Inicia a conversa com {otherUser.full_name}.</p>
          </div>
        )}
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-[10px] text-zinc-700 font-medium">{formatDate(date + "T12:00:00")}</span>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            <div className="space-y-1.5">
              {msgs.map((msg, i) => {
                const isOwn     = msg.sender_id === currentUserId;
                const isLast    = i === msgs.length - 1;
                const nextSame  = i < msgs.length - 1 && msgs[i + 1].sender_id === msg.sender_id;

                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? `rounded-2xl rounded-br-sm text-black ${nextSame ? "rounded-tr-lg" : ""}`
                          : `rounded-2xl rounded-bl-sm text-white bg-zinc-800/90 ${nextSame ? "rounded-tl-lg" : ""}`
                      }`}
                      style={isOwn ? { background: "linear-gradient(135deg,#E2C060,#A8893A)" } : undefined}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {isLast && (
                        <p className={`text-[10px] mt-1 ${isOwn ? "text-black/40 text-right" : "text-zinc-600"}`}>
                          {formatTime(msg.created_at)}
                          {isOwn && msg.read_at && <span className="ml-1">✓✓</span>}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="px-4 pt-3 border-t border-zinc-800/80 flex gap-2 items-end"
        style={{
          background: "rgba(18,18,20,0.95)",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKey}
          placeholder="Escreve uma mensagem..."
          rows={1}
          className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold/50 resize-none transition-colors overflow-hidden"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-bold transition-all active:scale-95 disabled:opacity-30 shrink-0"
          style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
