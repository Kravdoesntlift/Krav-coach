"use client";

import { useState, useTransition } from "react";
import {
  createAutomation,
  deleteAutomation,
  toggleAutomation,
} from "./actions";

type TriggerType =
  | "no_workout_days"
  | "no_checkin_days"
  | "perfect_week"
  | "checkin_monday";

interface CoachAutomation {
  id: string;
  coach_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_value: number;
  message_template: string;
  is_active: boolean;
  created_at: string;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  no_workout_days: "Sem treino há X dias",
  no_checkin_days: "Sem check-in há X dias",
  perfect_week: "Semana perfeita completa",
  checkin_monday: "Lembrete de check-in (segunda-feira)",
};

const TRIGGER_NEEDS_VALUE: TriggerType[] = ["no_workout_days", "no_checkin_days"];

function triggerDescription(automation: CoachAutomation): string {
  if (TRIGGER_NEEDS_VALUE.includes(automation.trigger_type)) {
    return TRIGGER_LABELS[automation.trigger_type].replace(
      "X",
      String(automation.trigger_value ?? "?")
    );
  }
  return TRIGGER_LABELS[automation.trigger_type];
}

interface FormState {
  name: string;
  trigger_type: TriggerType;
  trigger_value: string;
  message_template: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  trigger_type: "no_workout_days",
  trigger_value: "3",
  message_template: "",
};

interface Props {
  initialAutomations: CoachAutomation[];
  coachId: string;
}

export default function AutomationsClient({ initialAutomations }: Props) {
  const [automations, setAutomations] = useState<CoachAutomation[]>(initialAutomations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const needsValue = TRIGGER_NEEDS_VALUE.includes(form.trigger_type);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCancel() {
    setShowForm(false);
    setForm(DEFAULT_FORM);
    setFormError(null);
  }

  function handleSave() {
    if (!form.name.trim()) {
      setFormError("O nome é obrigatório.");
      return;
    }
    if (!form.message_template.trim()) {
      setFormError("A mensagem é obrigatória.");
      return;
    }
    if (needsValue && (!form.trigger_value || Number(form.trigger_value) < 1)) {
      setFormError("O número de dias deve ser pelo menos 1.");
      return;
    }

    setFormError(null);

    startTransition(async () => {
      const result = await createAutomation({
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        trigger_value: needsValue ? Number(form.trigger_value) : 0,
        message_template: form.message_template.trim(),
        is_active: true,
      });

      if (result.error) {
        setFormError(result.error ?? "Erro desconhecido.");
        return;
      }

      // Optimistic: add a placeholder while revalidation happens
      const newAuto: CoachAutomation = {
        id: crypto.randomUUID(),
        coach_id: "",
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        trigger_value: needsValue ? Number(form.trigger_value) : 0,
        message_template: form.message_template.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setAutomations((prev) => [newAuto, ...prev]);
      setShowForm(false);
      setForm(DEFAULT_FORM);
    });
  }

  function handleToggle(id: string, currentActive: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      const result = await toggleAutomation(id, !currentActive);
      if (!result.error) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a))
        );
      }
      setTogglingId(null);
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteAutomation(id);
      if (!result.error) {
        setAutomations((prev) => prev.filter((a) => a.id !== id));
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Automações</h1>
          <p className="text-gray-400 text-sm mt-1">
            Envia mensagens automáticas aos clientes com base em comportamentos
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            + Nova Automação
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card-gold p-5 rounded-2xl space-y-4">
          <h2 className="text-white font-semibold text-base">Nova Automação</h2>

          {/* Name */}
          <div>
            <label className="label">Nome</label>
            <input
              className="input mt-1"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Ex: Aviso de inatividade"
              disabled={isPending}
            />
          </div>

          {/* Trigger type */}
          <div>
            <label className="label">Tipo de gatilho</label>
            <select
              className="input mt-1"
              name="trigger_type"
              value={form.trigger_type}
              onChange={handleFormChange}
              disabled={isPending}
            >
              {(Object.entries(TRIGGER_LABELS) as [TriggerType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Trigger value (days): only for time-based triggers */}
          {needsValue && (
            <div>
              <label className="label">Número de dias</label>
              <input
                className="input mt-1 max-w-[120px]"
                name="trigger_value"
                type="number"
                min={1}
                value={form.trigger_value}
                onChange={handleFormChange}
                disabled={isPending}
              />
            </div>
          )}

          {/* Message template */}
          <div>
            <label className="label">
              Mensagem{" "}
              <span className="text-zinc-500 font-normal">
, usa{" "}
                <code className="text-brand-gold bg-zinc-800 px-1 rounded text-xs">
                  {"{{nome}}"}
                </code>{" "}
                para o nome do cliente
              </span>
            </label>
            <textarea
              className="input mt-1 min-h-[100px] resize-y"
              name="message_template"
              value={form.message_template}
              onChange={handleFormChange}
              placeholder={`Olá {{nome}}, reparei que não fizeste check-in há alguns dias. Tudo bem?`}
              disabled={isPending}
            />
          </div>

          {formError && (
            <p className="text-red-400 text-sm">{formError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-primary text-sm"
            >
              {isPending ? "A guardar…" : "Guardar"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {automations.length === 0 && !showForm && (
        <div className="card p-12 text-center space-y-4">
          <div className="text-4xl">⚡</div>
          <p className="text-white font-semibold">Nenhuma automação criada</p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Cria automações para enviar mensagens aos clientes automaticamente
            com base nos seus comportamentos.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            + Nova Automação
          </button>
        </div>
      )}

      {/* Automation list */}
      {automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              isToggling={togglingId === automation.id}
              isDeleting={deletingId === automation.id}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AutomationCard({
  automation,
  isToggling,
  isDeleting,
  onToggle,
  onDelete,
}: {
  automation: CoachAutomation;
  isToggling: boolean;
  isDeleting: boolean;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview =
    automation.message_template.length > 80
      ? automation.message_template.slice(0, 80) + "…"
      : automation.message_template;

  return (
    <div
      className={`card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-4 transition-opacity ${
        isDeleting ? "opacity-40" : ""
      }`}
    >
      {/* Left: info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm">{automation.name}</span>
          {automation.is_active ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
              Ativa
            </span>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
              Inativa
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs">{triggerDescription(automation)}</p>
        <p className="text-gray-600 text-xs italic truncate" title={automation.message_template}>
          {preview}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Toggle */}
        <button
          onClick={() => onToggle(automation.id, automation.is_active)}
          disabled={isToggling || isDeleting}
          aria-label={automation.is_active ? "Desativar" : "Ativar"}
          className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${
            automation.is_active ? "bg-brand-gold" : "bg-zinc-700"
          } ${isToggling ? "opacity-60" : ""}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              automation.is_active ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setConfirmDelete(false);
                onDelete(automation.id);
              }}
              disabled={isDeleting}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={isDeleting}
            aria-label="Eliminar"
            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
