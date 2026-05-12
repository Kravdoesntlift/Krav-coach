"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  coachId: string;
  clientId: string;
  existing: string | null;
}

export default function CoachNotes({ coachId, clientId, existing }: Props) {
  const [content, setContent] = useState(existing ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(!!existing);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const trimmed = content.trim();
    if (trimmed) {
      await supabase.from("coach_notes").upsert(
        { coach_id: coachId, client_id: clientId, content: trimmed, updated_at: new Date().toISOString() },
        { onConflict: "coach_id,client_id" }
      );
    } else {
      // Empty content → delete the note entirely
      await supabase.from("coach_notes")
        .delete()
        .eq("coach_id", coachId)
        .eq("client_id", clientId);
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">🔒</span>
          <h2 className="text-white font-semibold text-sm">Notas privadas</h2>
          <span className="text-xs text-gray-600">(só tu vês)</span>
        </div>
        <span className="text-gray-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSave} className="border-t border-zinc-800 p-5 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input min-h-[100px] resize-none text-sm"
            placeholder="Observações internas sobre este cliente — objetivos, limitações físicas, estratégias..."
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-4">
              {loading ? "A guardar..." : content.trim() ? "Guardar notas" : "Apagar nota"}
            </button>
            {saved && <span className="text-green-400 text-xs">Guardado!</span>}
          </div>
        </form>
      )}
    </div>
  );
}
