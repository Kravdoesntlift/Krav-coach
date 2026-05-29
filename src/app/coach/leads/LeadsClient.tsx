"use client";

import { useState, useTransition } from "react";
import { updateLeadStatus, updateLeadNotes, deleteLead } from "./actions";

type Lead = {
  id: string;
  name: string;
  email: string;
  status: string;
  notes: string | null;
  contacted_at: string | null;
  created_at: string;
  source: string;
};

const STATUS_CONFIG = {
  new:       { label: "Novo",       bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#60a5fa" },
  contacted: { label: "Contactado", bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.3)",   text: "#facc15" },
  converted: { label: "Cliente",    bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   text: "#4ade80" },
};

function LeadRow({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = (lead.status ?? "new") as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;

  const daysAgo = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);

  function handleStatus(next: "new" | "contacted" | "converted") {
    startTransition(() => updateLeadStatus(lead.id, next));
  }

  function handleNotesSave() {
    startTransition(() => updateLeadNotes(lead.id, notes));
    setShowNotes(false);
  }

  function handleDelete() {
    startTransition(() => deleteLead(lead.id));
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isPending ? "opacity-50" : ""}`}
      style={{ background: "#0f0f0f", borderColor: "rgba(255,255,255,0.07)" }}>

      {/* Main row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-white text-sm">{lead.name}</p>
            {/* Status badge */}
            <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}>
              {cfg.label}
            </span>
          </div>
          <a href={`mailto:${lead.email}`}
            className="text-xs hover:text-brand-gold transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            {lead.email}
          </a>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
            {daysAgo === 0 ? "hoje" : daysAgo === 1 ? "ontem" : `há ${daysAgo} dias`}
            {lead.contacted_at && (
              <span> · contactado a {new Date(lead.contacted_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}</span>
            )}
          </p>
          {lead.notes && !showNotes && (
            <p className="text-xs mt-1.5 italic" style={{ color: "rgba(255,255,255,0.3)" }}>
              "{lead.notes}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Status cycle buttons */}
          <div className="flex gap-1.5">
            {status !== "contacted" && status !== "converted" && (
              <button onClick={() => handleStatus("contacted")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "#facc15" }}>
                Contactado
              </button>
            )}
            {status !== "converted" && (
              <button onClick={() => handleStatus("converted")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>
                Cliente ✓
              </button>
            )}
            {status !== "new" && (
              <button onClick={() => handleStatus("new")}
                className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a" }}>
                Novo
              </button>
            )}
          </div>

          {/* Secondary actions */}
          <div className="flex gap-1.5">
            <button onClick={() => setShowNotes(!showNotes)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {showNotes ? "Fechar" : "Notas"}
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(239,68,68,0.07)", color: "rgba(239,68,68,0.5)", border: "1px solid rgba(239,68,68,0.15)" }}>
                Apagar
              </button>
            ) : (
              <button onClick={handleDelete}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                Confirmar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes area */}
      {showNotes && (
        <div className="mt-3 flex gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Respondeu ao DM, interessado em coaching…"
            rows={2}
            className="flex-1 text-xs text-white placeholder-zinc-600 px-3 py-2 rounded-xl resize-none outline-none"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <button onClick={handleNotesSave}
            className="text-[11px] font-bold px-3 py-2 rounded-xl transition-all"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C" }}>
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

export default function LeadsClient({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<"all" | "new" | "contacted" | "converted">("all");

  const counts = {
    all: leads.length,
    new: leads.filter((l) => (l.status ?? "new") === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => (l.status ?? "new") === filter);

  const tabs = [
    { key: "all",       label: "Todos",       color: "rgba(255,255,255,0.5)" },
    { key: "new",       label: "Novos",        color: "#60a5fa" },
    { key: "contacted", label: "Contactados",  color: "#facc15" },
    { key: "converted", label: "Clientes",     color: "#4ade80" },
  ] as const;

  if (!leads.length) return (
    <div className="rounded-2xl border border-zinc-800 p-10 text-center">
      <p className="text-zinc-500 text-sm">
        Ainda não há leads. Partilha o link{" "}
        <span className="text-brand-gold font-semibold">kravcoaching.com/guia</span> nas redes.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
            style={filter === t.key
              ? { background: "rgba(255,255,255,0.08)", color: t.color, border: "1px solid rgba(255,255,255,0.12)" }
              : { background: "transparent", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }
            }>
            {t.label}
            <span className="ml-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Lead cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-6">Nenhum lead nesta categoria.</p>
        ) : (
          filtered.map((lead) => <LeadRow key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}
