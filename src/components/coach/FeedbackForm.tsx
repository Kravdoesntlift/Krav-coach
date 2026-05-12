"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coachId: string;
  clientId: string;
  weekStart: string;
  existing: string | null;
}

export default function FeedbackForm({ coachId, clientId, weekStart, existing }: Props) {
  const [message, setMessage] = useState(existing ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const supabase = createClient();
    const trimmed = message.trim();

    if (trimmed) {
      await supabase.from("coach_feedback").upsert(
        { coach_id: coachId, client_id: clientId, week_start: weekStart, message: trimmed },
        { onConflict: "coach_id,client_id,week_start" }
      );
      // Notify client
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clientId,
          title: "💬 Feedback do teu coach",
          body: trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed,
          url: "/client/dashboard",
        }),
      }).catch(() => {});
    } else {
      // Empty → remove feedback so client banner disappears
      await supabase.from("coach_feedback")
        .delete()
        .eq("coach_id", coachId)
        .eq("client_id", clientId)
        .eq("week_start", weekStart);
    }

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="input min-h-[90px] resize-none text-sm"
        placeholder="Escreve o teu feedback para esta semana..."
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-sm py-2 px-4"
        >
          {loading ? "A guardar..." : message.trim() ? (existing ? "Atualizar" : "Enviar feedback") : "Remover feedback"}
        </button>
        {saved && (
          <span className="text-green-400 text-xs">Guardado!</span>
        )}
      </div>
    </form>
  );
}
