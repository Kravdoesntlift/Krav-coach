"use client";

import { useState } from "react";

interface Props {
  clientId?: string; // if undefined, sends to all clients
  label?: string;
}

const TYPES = [
  { value: "workout", label: "💪 Lembrete de treino" },
  { value: "checkin", label: "📊 Lembrete de check-in" },
  { value: "custom", label: "✉️ Mensagem personalizada" },
];

export default function NotifyButton({ clientId, label }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("workout");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    const res = await fetch("/api/notifications/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, clientId, message: message.trim() || undefined }),
    });
    const json = await res.json();
    setSending(false);
    setResult(json.sent > 0 ? `✓ Enviado para ${json.sent} dispositivo${json.sent !== 1 ? "s" : ""}` : "Sem dispositivos registados");
    setTimeout(() => { setResult(null); setOpen(false); }, 2500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white text-xs font-medium transition-colors"
      >
        🔔 {label ?? "Notificar"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl z-50 p-4 space-y-3">
          <p className="text-white text-sm font-semibold">Enviar notificação</p>

          <div className="space-y-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  type === t.value ? "bg-brand-gold/10 text-brand-gold border border-brand-gold/30" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {type === "custom" && (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreve a mensagem..."
              rows={2}
              maxLength={200}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
            />
          )}

          {result ? (
            <p className="text-center text-sm text-brand-gold font-medium">{result}</p>
          ) : (
            <button
              onClick={send}
              disabled={sending || (type === "custom" && !message.trim())}
              className="w-full py-2.5 bg-brand-gold text-black font-semibold rounded-xl text-sm disabled:opacity-40"
            >
              {sending ? "A enviar..." : "Enviar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
