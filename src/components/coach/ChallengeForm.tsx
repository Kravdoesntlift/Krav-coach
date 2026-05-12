"use client";

import { useState } from "react";
import { createChallenge, deleteChallenge } from "@/app/coach/clients/actions";
import { useRouter } from "next/navigation";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_count: number;
  week_start: string;
}

interface Props {
  coachId: string;
  clientId: string;
  weekStart: string;
  existing: Challenge[];
}

const TARGET_TYPES = [
  { value: "workouts", label: "Treinos" },
  { value: "checkins", label: "Check-ins" },
  { value: "weight_logs", label: "Registos de peso" },
  { value: "custom", label: "Personalizado" },
];

export default function ChallengeForm({ coachId, clientId, weekStart, existing }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState("workouts");
  const [targetCount, setTargetCount] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const result = await createChallenge({
      coachId,
      clientId,
      title: title.trim(),
      description: description.trim(),
      targetType,
      targetCount,
      weekStart,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    await deleteChallenge(id);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Existing challenges */}
      {existing.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-3 bg-zinc-800/60 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{c.title}</p>
            {c.description && <p className="text-gray-500 text-xs mt-0.5">{c.description}</p>}
            <p className="text-brand-gold text-xs mt-1">
              Meta: {c.target_count} {TARGET_TYPES.find((t) => t.value === c.target_type)?.label.toLowerCase()}
            </p>
          </div>
          <button
            onClick={() => handleDelete(c.id)}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors shrink-0"
          >
            Remover
          </button>
        </div>
      ))}

      {/* Add challenge */}
      {open ? (
        <div className="bg-zinc-800/60 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do desafio"
            maxLength={80}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold transition-colors"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            maxLength={150}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={99}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className="w-20 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-brand-gold"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg bg-zinc-700 text-gray-400 text-sm hover:bg-zinc-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || saving}
              className="flex-1 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {saving ? "A criar..." : "Criar desafio"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 text-gray-500 hover:text-white hover:border-zinc-500 text-sm transition-colors"
        >
          + Adicionar desafio
        </button>
      )}
    </div>
  );
}
