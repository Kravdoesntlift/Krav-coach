"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coachId: string;
  coachName: string;
  clientId: string;
  clientName: string;
}

export default function QuickMessage({ coachId, coachName, clientId, clientName }: Props) {
  const [open, setOpen]       = useState(false);
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);

    const supabase = createClient();
    await supabase.from("messages").insert({
      sender_id: coachId,
      receiver_id: clientId,
      content: trimmed,
    });

    // Push notification
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: clientId,
        title: `💬 ${coachName}`,
        body: trimmed.slice(0, 100),
        url: "/client/chat",
      }),
    }).catch(() => {});

    setText("");
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); }, 1500);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative" onClick={(e) => e.preventDefault()}>
      {/* Toggle button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${
          open ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        }`}
        title={`Mensagem rápida para ${clientName}`}
      >
        💬
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg,#1a1a1a,#111)", border: "1px solid rgba(63,63,70,0.6)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-zinc-800/80">
            <p className="text-white text-xs font-semibold">Mensagem para {clientName}</p>
          </div>
          <div className="p-3 space-y-2">
            {sent ? (
              <div className="text-center py-3">
                <p className="text-green-400 text-sm font-semibold">✓ Enviado!</p>
              </div>
            ) : (
              <>
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Escreve uma mensagem..."
                  rows={3}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold/50 resize-none transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={send}
                    disabled={!text.trim() || sending}
                    className="flex-1 py-2 rounded-xl text-black text-xs font-bold transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
                  >
                    {sending ? "..." : "Enviar ↑"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
