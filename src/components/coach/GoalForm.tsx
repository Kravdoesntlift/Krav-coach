"use client";

import { useState } from "react";
import { createGoal, deleteGoal, updateGoalProgress } from "@/app/coach/clients/actions";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  deadline: string | null;
  completed: boolean;
}

interface Props {
  clientId: string;
  initialGoals: Goal[];
}

export default function GoalForm({ clientId, initialGoals }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    const res = await createGoal({
      clientId,
      title: title.trim(),
      description: description.trim() || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit: unit.trim() || null,
      deadline: deadline || null,
    });
    if (res?.goal) {
      setGoals((prev) => [...prev, res.goal as Goal]);
      setTitle(""); setDescription(""); setTargetValue(""); setDeadline("");
      setOpen(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleToggleComplete(goal: Goal) {
    const newVal = goal.completed ? 0 : (goal.target_value ?? 1);
    await updateGoalProgress(goal.id, newVal, !goal.completed);
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, current_value: newVal, completed: !g.completed } : g));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Metas do cliente</h3>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20 transition-colors"
        >
          + Nova meta
        </button>
      </div>

      {open && (
        <div className="bg-zinc-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ex: Perder 5kg)"
            className="input text-sm w-full"
            maxLength={80}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="input text-sm w-full"
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Valor alvo</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="ex: 75"
                className="input text-sm w-full"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1 block">Unidade</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input text-sm w-full"
              >
                {["kg", "cm", "reps", "%", "semanas", "dias", "outro"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Prazo</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 py-2 bg-zinc-700 text-gray-400 rounded-xl text-sm">Cancelar</button>
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="flex-1 py-2 bg-brand-gold text-black font-semibold rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Criar meta"}
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !open && (
        <p className="text-gray-600 text-xs">Ainda sem metas para este cliente.</p>
      )}

      <div className="space-y-2">
        {goals.map((goal) => {
          const pct = goal.target_value && goal.current_value != null
            ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
            : goal.completed ? 100 : 0;
          const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;

          return (
            <div key={goal.id} className={`rounded-xl p-3 border transition-colors ${goal.completed ? "bg-green-500/10 border-green-500/20" : "bg-zinc-800 border-zinc-700"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{goal.title}</span>
                    {goal.completed && <span className="text-green-400 text-xs">✓ Concluída</span>}
                  </div>
                  {goal.description && <p className="text-gray-500 text-xs mt-0.5">{goal.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    {goal.target_value != null && (
                      <span className="text-gray-400 text-xs">
                        {goal.current_value ?? 0} / {goal.target_value} {goal.unit}
                      </span>
                    )}
                    {daysLeft != null && (
                      <span className={`text-xs ${daysLeft < 7 ? "text-red-400" : daysLeft < 30 ? "text-yellow-400" : "text-gray-500"}`}>
                        {daysLeft > 0 ? `${daysLeft}d restantes` : "Prazo passado"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleComplete(goal)}
                    className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-colors ${goal.completed ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-gray-400 hover:text-green-400"}`}
                  >✓</button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="w-7 h-7 rounded-lg bg-zinc-700 text-gray-400 hover:text-red-400 text-xs flex items-center justify-center transition-colors"
                  >✕</button>
                </div>
              </div>
              {goal.target_value != null && (
                <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${goal.completed ? "bg-green-500" : "bg-brand-gold"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
