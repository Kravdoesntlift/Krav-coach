"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { assignClient, unassignClient, activateClient, archiveClient, unarchiveClient, deleteClient } from "./actions";

export interface ClientRow {
  id: string;
  full_name: string;
  status: string | null;
  avatar_url: string | null;
  trial_ends_at?: string | null;
  trial_expired?: boolean;
  assignments: { assigned_role: string; coach_id: string }[];
}

interface Props {
  allClients: ClientRow[];
  coachId: string;
  inviteUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
  coach: "Coach",
  nutritionist: "Nutricionista",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "Ativo",     color: "text-green-400 bg-green-400/10" },
  pending:   { label: "Pendente",  color: "text-yellow-400 bg-yellow-400/10" },
  paused:    { label: "Pausado",   color: "text-yellow-400 bg-yellow-400/10" },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-400/10" },
};

function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image src={url} alt={name} width={size} height={size} className="rounded-full object-cover shrink-0" />
    );
  }
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.1))",
        border: "1px solid rgba(201,168,76,0.22)", color: "#C9A84C",
      }}
    >
      {initials}
    </div>
  );
}

function ClientCard({
  client, coachId, onAssigned, onUnassigned, onActivated, onArchived, onUnarchived, onDeleted,
}: {
  client: ClientRow; coachId: string;
  onAssigned: (clientId: string, role: string) => void;
  onUnassigned: (clientId: string, role: string) => void;
  onActivated?: (clientId: string) => void;
  onArchived?: (clientId: string) => void;
  onUnarchived?: (clientId: string) => void;
  onDeleted?: (clientId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [assignRole, setAssignRole] = useState("coach");
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const myAssignments = client.assignments.filter((a) => a.coach_id === coachId);
  const isMyCoach   = myAssignments.some((a) => a.assigned_role === "coach");
  const isMyNutri   = myAssignments.some((a) => a.assigned_role === "nutritionist");
  const isPending   = client.status === "pending";
  const isArchived  = client.status === "archived";

  const st = STATUS_LABELS[client.status ?? "active"] ?? STATUS_LABELS["active"];

  function handleAssign() {
    setActionError(null);
    startTransition(async () => {
      const res = await assignClient(client.id, assignRole);
      if (res.error) {
        setActionError(res.error);
      } else {
        onAssigned(client.id, assignRole);
        setShowRoleSelect(false);
      }
    });
  }

  function handleUnassign(role: string) {
    setActionError(null);
    startTransition(async () => {
      const res = await unassignClient(client.id, role);
      if (res.error) {
        setActionError(res.error);
      } else {
        onUnassigned(client.id, role);
      }
    });
  }

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-3">
        <Avatar name={client.full_name} url={client.avatar_url} size={44} />

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{client.full_name}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
              {st.label}
            </span>
            {client.trial_expired && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-red-400 bg-red-400/10">
                Trial expirado
              </span>
            )}
            {myAssignments.map((a) => (
              <span key={a.assigned_role}
                className="text-[11px] px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
                {ROLE_LABELS[a.assigned_role] ?? a.assigned_role}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0" ref={menuRef}>
          {/* Activate button for pending clients */}
          {isPending && isMyCoach && (
            <button
              onClick={() => {
                setActionError(null);
                startTransition(async () => {
                  const res = await activateClient(client.id);
                  if (res.error) setActionError(res.error);
                  else onActivated?.(client.id);
                });
              }}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              {pending ? "..." : "✓ Ativar"}
            </button>
          )}

          {myAssignments.map((a) => (
            <button key={a.assigned_role}
              onClick={() => handleUnassign(a.assigned_role)}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-50">
              {pending ? "..." : `Remover`}
            </button>
          ))}

          {(!isMyCoach || !isMyNutri) && (
            showRoleSelect ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={assignRole}
                  onChange={(e) => { setAssignRole(e.target.value); setActionError(null); }}
                  className="bg-zinc-800 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-gold"
                >
                  {!isMyCoach  && <option value="coach">Coach</option>}
                  {!isMyNutri  && <option value="nutritionist">Nutricionista</option>}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-black text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {pending ? "A guardar..." : "Confirmar"}
                </button>
                <button
                  onClick={() => { setShowRoleSelect(false); setActionError(null); }}
                  className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-400 text-xs hover:bg-zinc-600 transition-colors flex items-center justify-center"
                  aria-label="Cancelar"
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => setShowRoleSelect(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-gray-300 text-xs hover:border-brand-gold hover:text-brand-gold transition-colors"
              >
                + Atribuir
              </button>
            )
          )}

          {/* ⋯ menu: archive / delete */}
          <div className="relative">
            <button
              onClick={() => { setShowMenu((v) => !v); setConfirmDelete(false); }}
              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm flex items-center justify-center transition-colors"
            >⋯</button>

            {showMenu && (
              <div
                className="absolute right-0 top-9 z-50 min-w-[160px] rounded-xl overflow-hidden shadow-xl"
                style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Archive / Restore */}
                {isArchived ? (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setActionError(null);
                      startTransition(async () => {
                        const res = await unarchiveClient(client.id);
                        if (res.error) setActionError(res.error);
                        else onUnarchived?.(client.id);
                      });
                    }}
                    disabled={pending}
                    className="w-full text-left px-4 py-2.5 text-xs text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-2.5 disabled:opacity-50"
                  >
                    <span>♻️</span> Restaurar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setActionError(null);
                      startTransition(async () => {
                        const res = await archiveClient(client.id);
                        if (res.error) setActionError(res.error);
                        else onArchived?.(client.id);
                      });
                    }}
                    disabled={pending}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-700/60 transition-colors flex items-center gap-2.5 disabled:opacity-50"
                  >
                    <span>📦</span> Arquivar
                  </button>
                )}

                <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />

                {/* Delete: 2-step confirm */}
                {confirmDelete ? (
                  <div className="px-3 py-2.5 space-y-2">
                    <p className="text-[11px] text-red-400 leading-snug">Apaga a conta permanentemente. Sem recuperação.</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setConfirmDelete(false);
                          setActionError(null);
                          startTransition(async () => {
                            const res = await deleteClient(client.id);
                            if (res.error) setActionError(res.error);
                            else onDeleted?.(client.id);
                          });
                        }}
                        disabled={pending}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {pending ? "..." : "Confirmar"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1.5 rounded-lg bg-zinc-700 text-zinc-400 text-[11px] hover:bg-zinc-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                  >
                    <span>🗑</span> Eliminar conta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline error message */}
      {actionError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <span className="text-red-400 text-xs shrink-0">⚠</span>
          <p className="text-red-400 text-xs leading-relaxed">{actionError}</p>
        </div>
      )}
    </div>
  );
}

export default function ManageClientsClient({ allClients, coachId, inviteUrl }: Props) {
  const [clients, setClients] = useState(allClients);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"mine" | "all" | "archived">("mine");

  function handleAssigned(clientId: string, role: string) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, assignments: [...c.assignments, { assigned_role: role, coach_id: coachId }] }
          : c
      )
    );
  }

  function handleUnassigned(clientId: string, role: string) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, assignments: c.assignments.filter((a) => !(a.coach_id === coachId && a.assigned_role === role)) }
          : c
      )
    );
  }

  function handleActivated(clientId: string) {
    setClients((prev) =>
      prev.map((c) => c.id === clientId ? { ...c, status: "active" } : c)
    );
  }

  function handleArchived(clientId: string) {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, status: "archived" } : c));
  }

  function handleUnarchived(clientId: string) {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, status: "active" } : c));
  }

  function handleDeleted(clientId: string) {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  }

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const q = search.toLowerCase();
  const allFiltered = clients.filter((c) => c.full_name.toLowerCase().includes(q));
  const archived = allFiltered.filter((c) => c.status === "archived");
  const active   = allFiltered.filter((c) => c.status !== "archived");
  const mine     = active.filter((c) => c.assignments.some((a) => a.coach_id === coachId));
  const others   = active.filter((c) => !c.assignments.some((a) => a.coach_id === coachId));

  const displayed = tab === "mine" ? mine : tab === "all" ? others : archived;

  return (
    <div className="space-y-5">
      {/* Invite link */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.05))",
          border: "1px solid rgba(201,168,76,0.22)",
        }}>
        <div className="min-w-0">
          <p className="text-brand-gold text-sm font-semibold">🔗 Link de convite</p>
          <p className="text-zinc-500 text-xs mt-0.5 truncate">{inviteUrl}</p>
          <p className="text-zinc-600 text-[11px] mt-1">
            O cliente fica automaticamente atribuído a ti ao registar com este link.
          </p>
        </div>
        <button onClick={copyInvite}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            copied ? "bg-green-600 text-white" : "bg-brand-gold hover:bg-brand-gold-dark text-black"
          }`}>
          {copied ? "✓ Copiado!" : "Copiar"}
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTab("mine")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === "mine" ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}>
          Os meus ({mine.length})
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === "all" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}>
          Disponíveis ({others.length})
        </button>
        {archived.length > 0 && (
          <button
            onClick={() => setTab("archived")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === "archived" ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}>
            📦 Arquivo ({archived.length})
          </button>
        )}
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..." className="input flex-1 text-sm py-2 min-w-[120px]" />
      </div>

      {/* Client list */}
      <div className="space-y-3">
        {displayed.map((c) => (
          <ClientCard key={c.id} client={c} coachId={coachId}
            onAssigned={handleAssigned} onUnassigned={handleUnassigned}
            onActivated={handleActivated} onArchived={handleArchived}
            onUnarchived={handleUnarchived} onDeleted={handleDeleted} />
        ))}
        {displayed.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-zinc-500 text-sm">
              {tab === "mine"
                ? "Ainda não tens clientes atribuídos. Vai ao separador 'Disponíveis'."
                : tab === "archived"
                ? "Nenhum cliente arquivado."
                : search ? "Nenhum cliente encontrado." : "Sem outros clientes registados."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
