"use client";

import { useState } from "react";

export default function SendTrialEmailButton({
  clientId,
  daysLeft,
}: {
  clientId: string;
  daysLeft: number;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    setState("sending");
    const res = await fetch("/api/coach/send-trial-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    setState(res.ok ? "sent" : "error");
    if (res.ok) setTimeout(() => setState("idle"), 4000);
  }

  return (
    <button
      onClick={send}
      disabled={state === "sending" || state === "sent"}
      className="text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50"
      style={
        state === "sent"
          ? { borderColor: "rgba(74,222,128,0.3)", color: "#4ade80", background: "rgba(74,222,128,0.07)" }
          : state === "error"
          ? { borderColor: "rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.07)" }
          : { borderColor: "rgba(201,168,76,0.28)", color: "#C9A84C", background: "rgba(201,168,76,0.05)" }
      }
    >
      {state === "sending" ? "A enviar..." : state === "sent" ? "✓ Email enviado!" : state === "error" ? "Erro, tenta de novo" : `📧 Enviar aviso de trial (${daysLeft}d)`}
    </button>
  );
}
