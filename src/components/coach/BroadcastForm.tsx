"use client";

import { useState } from "react";
import { broadcastMessage } from "@/app/coach/clients/actions";

export default function BroadcastForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"active" | "all">("active");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    const res = await broadcastMessage(message.trim(), target);
    setSending(false);
    setResult(res);
    if (!res.error) {
      setMessage("");
      setTimeout(() => {
        setResult(null);
        setOpen(false);
      }, 3000);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white text-sm transition-colors"
      >
        <span>📢</span>
        Mensagem em massa
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Mensagem em massa</h3>
        <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white text-sm transition-colors" aria-label="Fechar">✕</button>
      </div>

      {/* Target selector */}
      <div className="flex gap-2">
        {([
          { value: "active", label: "Clientes ativos" },
          { value: "all", label: "Todos os clientes" },
        ] as const).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTarget(opt.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              target === opt.value
                ? "bg-brand-gold text-black"
                : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escreve a tua mensagem..."
        rows={4}
        maxLength={500}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold transition-colors resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">{message.length}/500</span>
        {result?.error && <p className="text-red-400 text-xs">{result.error}</p>}
        {result?.count !== undefined && !result.error && (
          <p className="text-green-400 text-xs">Enviado para {result.count} cliente{result.count !== 1 ? "s" : ""}!</p>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="w-full py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold transition-colors disabled:opacity-40"
      >
        {sending ? "A enviar..." : "Enviar mensagem"}
      </button>
    </div>
  );
}
