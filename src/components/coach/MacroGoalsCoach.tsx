"use client";

import { useEffect, useState } from "react";

interface Props {
  clientId: string;
}

interface Goals {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  goal: string | null;
}

const GOAL_LABELS: Record<string, string> = {
  cut: "Perder gordura",
  maintenance: "Manutenção",
  bulk: "Ganhar massa",
};

function MacroField({
  label, value, unit, color, onChange,
}: {
  label: string; value: string; unit: string; color: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={`label text-xs ${color}`}>{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number" min={0} max={9999}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input text-center font-bold py-2"
        />
        <span className="text-zinc-500 text-xs">{unit}</span>
      </div>
    </div>
  );
}

export default function MacroGoalsCoach({ clientId }: Props) {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [goal, setGoal] = useState("maintenance");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/nutrition/goals?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        setGoals(d.goals);
        if (d.goals) {
          setCalories(String(d.goals.target_calories ?? ""));
          setProtein(String(d.goals.target_protein_g ?? ""));
          setCarbs(String(d.goals.target_carbs_g ?? ""));
          setFat(String(d.goals.target_fat_g ?? ""));
          setGoal(d.goals.goal ?? "maintenance");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientId]);

  // Auto-calculate macros from calories when calories change (smart defaults)
  function autoFill() {
    const kcal = parseInt(calories);
    if (!kcal || kcal < 800) return;
    const p = Math.round(kcal * 0.30 / 4);   // 30% protein
    const f = Math.round(kcal * 0.25 / 9);   // 25% fat
    const c = Math.round((kcal - p * 4 - f * 9) / 4);
    setProtein(String(p));
    setFat(String(f));
    setCarbs(String(Math.max(0, c)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch("/api/nutrition/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        goal,
      }),
    });
    if (res.ok) {
      setMsg({ type: "ok", text: "Metas guardadas!" });
      setGoals({
        target_calories: parseInt(calories) || null,
        target_protein_g: parseInt(protein) || null,
        target_carbs_g: parseInt(carbs) || null,
        target_fat_g: parseInt(fat) || null,
        goal,
      });
      setTimeout(() => { setMsg(null); setOpen(false); }, 1500);
    } else {
      const d = await res.json();
      setMsg({ type: "err", text: d.error ?? "Erro." });
    }
    setSaving(false);
  }

  if (loading) return null;

  return (
    <div className="card p-4 space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🥗</span>
          <div className="text-left">
            <p className="text-white text-sm font-semibold">Metas Nutricionais</p>
            {goals?.target_calories ? (
              <p className="text-zinc-500 text-xs">
                {goals.target_calories} kcal · {goals.target_protein_g}g P · {goals.target_carbs_g}g C · {goals.target_fat_g}g G
                {goals.goal && <span className="ml-1 text-brand-gold">· {GOAL_LABELS[goals.goal] ?? goals.goal}</span>}
              </p>
            ) : (
              <p className="text-zinc-600 text-xs">Sem metas definidas</p>
            )}
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-zinc-800">
          {/* Goal type */}
          <div>
            <label className="label text-xs">Objetivo</label>
            <div className="flex gap-2">
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <button
                  key={k} type="button"
                  onClick={() => setGoal(k)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    goal === k
                      ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Calories with auto-fill */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label text-xs text-yellow-400">Calorias totais</label>
              <button
                type="button" onClick={autoFill}
                className="text-[11px] text-brand-gold hover:underline"
              >
                Auto-calcular macros →
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min={800} max={6000}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="input text-center font-bold py-2"
                placeholder="ex: 2200"
              />
              <span className="text-zinc-500 text-xs">kcal</span>
            </div>
          </div>

          {/* Macros grid */}
          <div className="grid grid-cols-3 gap-3">
            <MacroField label="Proteína" value={protein} unit="g" color="text-blue-400" onChange={setProtein} />
            <MacroField label="Hidratos" value={carbs}   unit="g" color="text-orange-400" onChange={setCarbs} />
            <MacroField label="Gordura"  value={fat}     unit="g" color="text-pink-400" onChange={setFat} />
          </div>

          {/* Calorie check */}
          {calories && protein && carbs && fat && (
            <div className="text-xs text-center">
              {(() => {
                const computed = parseInt(protein) * 4 + parseInt(carbs) * 4 + parseInt(fat) * 9;
                const target = parseInt(calories);
                const diff = computed - target;
                return (
                  <span className={Math.abs(diff) > 50 ? "text-red-400" : "text-green-400"}>
                    {computed} kcal calculadas {Math.abs(diff) > 50 ? `(${diff > 0 ? "+" : ""}${diff} vs meta)` : "✓"}
                  </span>
                );
              })()}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit" disabled={saving || !calories}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-40"
            >
              {saving ? "A guardar…" : "Guardar metas"}
            </button>
            {msg && (
              <span className={`text-xs font-semibold ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
