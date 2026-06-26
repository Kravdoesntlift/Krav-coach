"use client";

import { useState } from "react";
import { updateClientSubscription } from "@/app/coach/clients/actions";
import { useRouter } from "next/navigation";
import type { ClientStatus } from "@/lib/supabase/types";

interface Props {
  clientId: string;
  currentStatus: ClientStatus;
  renewsAt: string | null;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: "Ativo",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",   dot: "bg-green-400 animate-pulse" },
  paused:    { label: "Pausado",   color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-400" },
  cancelled: { label: "Cancelado", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",       dot: "bg-red-400" },
  archived:  { label: "Arquivado", color: "text-zinc-400",   bg: "bg-zinc-500/10 border-zinc-500/30",     dot: "bg-zinc-500" },
  pending:   { label: "Pendente",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",     dot: "bg-blue-400" },
};

export default function ClientStatusForm({ clientId, currentStatus, renewsAt }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ClientStatus>(currentStatus);
  const [renews, setRenews] = useState(renewsAt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await updateClientSubscription(clientId, status, renews || null);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const cfg = STATUS_CONFIG[status];

  return (
    <div className="space-y-4">
      {/* Current status pill */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.bg} ${cfg.color}`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </div>

      {/* Status selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(STATUS_CONFIG) as ClientStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              status === s ? "bg-brand-gold text-black" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
            }`}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Renewal date */}
      <div>
        <label className="label">Data de renovação</label>
        <input
          type="date"
          value={renews}
          onChange={(e) => setRenews(e.target.value)}
          className="input"
        />
        {renews && (
          <p className="text-xs text-gray-500 mt-1">
            {(() => {
              const diff = Math.ceil((new Date(renews + "T00:00:00").getTime() - Date.now()) / 86400000);
              if (diff < 0) return "⚠ Data já passou";
              if (diff === 0) return "Renova hoje";
              return `Faltam ${diff} dia${diff !== 1 ? "s" : ""}`;
            })()}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
          saved ? "bg-green-600 text-white" : "btn-primary"
        }`}
      >
        {saving ? "A guardar..." : saved ? "Guardado!" : "Actualizar estado"}
      </button>
    </div>
  );
}
