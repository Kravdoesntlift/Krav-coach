"use client";

import { useState, useTransition, useOptimistic } from "react";
import { createSession, updateSessionStatus, deleteSession } from "./actions";

export interface SessionWithClient {
  id: string;
  client_id: string | null;
  client_name: string | null;
  client_avatar_url?: string | null;
  scheduled_at: string;
  duration_min: number;
  session_type: string;
  location_or_link: string | null;
  notes: string | null;
  status: string;
}

export interface ClientOption {
  id: string;
  full_name: string;
}

interface Props {
  sessions: SessionWithClient[];
  clients: ClientOption[];
  coachId: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ClientAvatar({ name, url }: { name: string | null; url?: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? ""}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{
        background: "linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.1))",
        border: "1px solid rgba(201,168,76,0.22)",
        color: "#C9A84C",
      }}
    >
      {initials(name)}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed:  { label: "Confirmada",  color: "text-green-400 bg-green-400/10" },
  completed:  { label: "Concluída",   color: "text-zinc-400 bg-zinc-800" },
  cancelled:  { label: "Cancelada",   color: "text-red-400 bg-red-400/10" },
};

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  online:     { label: "Online",      color: "text-blue-400 bg-blue-400/10" },
  presencial: { label: "Presencial",  color: "text-brand-gold bg-brand-gold/10" },
};

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onStatusChange,
  onDelete,
}: {
  session: SessionWithClient;
  onStatusChange: (id: string, status: "confirmed" | "cancelled" | "completed") => void;
  onDelete: (id: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, startTransition] = useTransition();

  const status = STATUS_MAP[session.status] ?? STATUS_MAP.confirmed;
  const type = TYPE_MAP[session.session_type] ?? TYPE_MAP.presencial;
  const isPast = session.status !== "confirmed";

  function handleComplete() {
    startTransition(async () => {
      onStatusChange(session.id, "completed");
      await updateSessionStatus(session.id, "completed");
    });
  }

  function handleCancel() {
    if (!confirmCancel) { setConfirmCancel(true); return; }
    startTransition(async () => {
      onStatusChange(session.id, "cancelled");
      await updateSessionStatus(session.id, "cancelled");
      setConfirmCancel(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      onDelete(session.id);
      await deleteSession(session.id);
    });
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Top row: avatar + name + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ClientAvatar name={session.client_name} url={session.client_avatar_url} />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {session.client_name ?? "Sem cliente"}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(session.scheduled_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${type.color}`}>
            {type.label}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
        <span>{session.duration_min} min</span>
        {session.location_or_link && (
          session.session_type === "online" ? (
            <a
              href={session.location_or_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold hover:underline truncate max-w-[200px]"
            >
              {session.location_or_link}
            </a>
          ) : (
            <span className="truncate max-w-[200px]">{session.location_or_link}</span>
          )
        )}
      </div>

      {session.notes && (
        <p className="text-sm text-zinc-500 italic line-clamp-2">{session.notes}</p>
      )}

      {/* Actions */}
      {!isPast && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <button
            onClick={handleComplete}
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold text-black font-semibold hover:bg-brand-gold-dark transition-colors disabled:opacity-50"
          >
            Concluída
          </button>
          <button
            onClick={handleCancel}
            disabled={pending}
            onBlur={() => setConfirmCancel(false)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50
              ${confirmCancel
                ? "bg-red-500 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400"
              }`}
          >
            {confirmCancel ? "Confirmar cancelamento" : "Cancelar sessão"}
          </button>
        </div>
      )}

      {isPast && (
        <div className="flex justify-end pt-1">
          <button
            onClick={handleDelete}
            disabled={pending}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── New session form ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  client_id: "",
  datetime: "",
  duration_min: 60,
  session_type: "online" as "online" | "presencial",
  location_or_link: "",
  notes: "",
};

function NewSessionForm({
  clients,
  coachId,
  onCreated,
  onCancel,
}: {
  clients: ClientOption[];
  coachId: string;
  onCreated: (session: SessionWithClient) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!form.datetime) { setError("A data e hora são obrigatórias."); return; }
    setError(null);

    const clientName =
      form.client_id
        ? (clients.find((c) => c.id === form.client_id)?.full_name ?? null)
        : null;

    const optimistic: SessionWithClient = {
      id: `temp-${Date.now()}`,
      client_id: form.client_id || null,
      client_name: clientName,
      scheduled_at: new Date(form.datetime).toISOString(),
      duration_min: form.duration_min,
      session_type: form.session_type,
      location_or_link: form.location_or_link || null,
      notes: form.notes || null,
      status: "confirmed",
    };

    startTransition(async () => {
      onCreated(optimistic);
      const res = await createSession({
        client_id: form.client_id || null,
        scheduled_at: new Date(form.datetime).toISOString(),
        duration_min: form.duration_min,
        session_type: form.session_type,
        location_or_link: form.location_or_link || null,
        notes: form.notes || null,
      });
      if (res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <h3 className="font-semibold text-white">Nova sessão</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client */}
        <div>
          <label className="label">Cliente</label>
          <select
            className="input w-full"
            value={form.client_id}
            onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
          >
            <option value="">Sem cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>

        {/* Date + time */}
        <div>
          <label className="label">Data e hora *</label>
          <input
            type="datetime-local"
            className="input w-full"
            value={form.datetime}
            onChange={(e) => setForm((f) => ({ ...f, datetime: e.target.value }))}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="label">Duração</label>
          <select
            className="input w-full"
            value={form.duration_min}
            onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))}
          >
            {[30, 45, 60, 90, 120].map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </div>

        {/* Link / location */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0 transition-all">
              {form.session_type === "online" ? "Link da videochamada" : "Localização"}
            </label>
            {form.session_type === "online" && (
              <button
                type="button"
                onClick={() => {
                  const roomId = Math.random().toString(36).slice(2, 8);
                  setForm((f) => ({
                    ...f,
                    location_or_link: `https://meet.jit.si/krav-${roomId}`,
                  }));
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors font-medium whitespace-nowrap"
              >
                🎥 Gerar sala Jitsi
              </button>
            )}
          </div>
          <input
            type="text"
            className="input w-full transition-all"
            placeholder={
              form.session_type === "online"
                ? "https://meet.google.com/... ou https://zoom.us/..."
                : "Morada ou ginásio"
            }
            value={form.location_or_link}
            onChange={(e) => setForm((f) => ({ ...f, location_or_link: e.target.value }))}
          />
        </div>
      </div>

      {/* Type toggle */}
      <div>
        <label className="label">Tipo de sessão</label>
        <div className="flex gap-2 mt-1">
          {(["online", "presencial"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setForm((f) => ({ ...f, session_type: t }))}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize
                ${form.session_type === t
                  ? "bg-brand-gold text-black border-brand-gold"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
                }`}
            >
              {t === "online" ? "Online" : "Presencial"}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notas (opcional)</label>
        <textarea
          className="input w-full min-h-[72px] resize-none"
          placeholder="Objetivos da sessão, exercícios previstos..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={pending}
          className="btn-primary text-sm"
        >
          {pending ? "A guardar..." : "Criar sessão"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SessionsClient({ sessions, clients, coachId }: Props) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [showForm, setShowForm] = useState(false);

  const now = new Date().toISOString();

  const [optimisticSessions, updateOptimistic] = useOptimistic(
    sessions,
    (
      state: SessionWithClient[],
      action:
        | { type: "add"; session: SessionWithClient }
        | { type: "status"; id: string; status: string }
        | { type: "delete"; id: string }
    ) => {
      if (action.type === "add") return [action.session, ...state];
      if (action.type === "status")
        return state.map((s) =>
          s.id === action.id ? { ...s, status: action.status } : s
        );
      if (action.type === "delete") return state.filter((s) => s.id !== action.id);
      return state;
    }
  );

  const upcoming = optimisticSessions.filter(
    (s) => s.status === "confirmed" && s.scheduled_at >= now
  ).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const past = optimisticSessions.filter(
    (s) => s.status !== "confirmed" || s.scheduled_at < now
  ).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {([
            { key: "upcoming", label: `Próximas (${upcoming.length})` },
            { key: "past",     label: `Passadas (${past.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
                ${tab === key
                  ? "bg-brand-gold text-black"
                  : "text-zinc-400 hover:text-white"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary whitespace-nowrap"
        >
          {showForm ? "Cancelar" : "+ Nova sessão"}
        </button>
      </div>

      {/* New session form */}
      {showForm && (
        <NewSessionForm
          clients={clients}
          coachId={coachId}
          onCreated={(session) => {
            updateOptimistic({ type: "add", session });
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Session list */}
      {list.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <div className="text-5xl">{tab === "upcoming" ? "📅" : "🗓️"}</div>
          <p className="text-zinc-400 text-sm">
            {tab === "upcoming"
              ? "Sem sessões próximas confirmadas."
              : "Sem sessões passadas."}
          </p>
          {tab === "upcoming" && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              + Criar sessão
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStatusChange={(id, status) =>
                updateOptimistic({ type: "status", id, status })
              }
              onDelete={(id) => updateOptimistic({ type: "delete", id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
