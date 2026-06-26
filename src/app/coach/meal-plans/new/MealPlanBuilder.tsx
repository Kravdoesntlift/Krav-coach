"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface ClientOption {
  id: string;
  full_name: string;
}

interface FoodInput {
  food_name: string;
  quantity: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  notes: string;
}

type MealType =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "supper"
  | "snack";

interface MealInput {
  meal_type: MealType;
  name: string;
  foods: FoodInput[];
}

const MEAL_TYPE_META: Record<MealType, { label_pt: string; label_en: string }> = {
  breakfast:       { label_pt: "Pequeno-almoço", label_en: "Breakfast"       },
  morning_snack:   { label_pt: "Snack manhã",    label_en: "Morning snack"   },
  lunch:           { label_pt: "Almoço",          label_en: "Lunch"           },
  afternoon_snack: { label_pt: "Snack tarde",     label_en: "Afternoon snack" },
  dinner:          { label_pt: "Jantar",          label_en: "Dinner"          },
  supper:          { label_pt: "Ceia",            label_en: "Supper"          },
  snack:           { label_pt: "Snack",           label_en: "Snack"           },
};

const GOAL_OPTIONS: { value: "cut" | "bulk" | "maintenance"; label_pt: string; label_en: string }[] = [
  { value: "cut",         label_pt: "Perder gordura", label_en: "Lose fat"    },
  { value: "bulk",        label_pt: "Ganhar massa",   label_en: "Build muscle" },
  { value: "maintenance", label_pt: "Manutenção",     label_en: "Maintenance" },
];

const EMPTY_FOOD: FoodInput = {
  food_name: "", quantity: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", notes: "",
};

function emptyMeal(): MealInput {
  return { meal_type: "snack", name: "Snack", foods: [{ ...EMPTY_FOOD }] };
}

export default function MealPlanBuilder({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName]         = useState("");
  const [goal, setGoal]         = useState<"cut" | "bulk" | "maintenance">("maintenance");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes]       = useState("");
  const [meals, setMeals]       = useState<MealInput[]>([
    { meal_type: "breakfast", name: "Pequeno-almoço", foods: [{ ...EMPTY_FOOD }] },
    { meal_type: "lunch",     name: "Almoço",          foods: [{ ...EMPTY_FOOD }] },
    { meal_type: "dinner",    name: "Jantar",           foods: [{ ...EMPTY_FOOD }] },
  ]);

  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState<string | null>(null);

  // ── Meal helpers ──────────────────────────────────────────────────────────

  function addMeal() {
    setMeals((prev) => [...prev, emptyMeal()]);
  }

  function removeMeal(idx: number) {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateMeal(idx: number, patch: Partial<MealInput>) {
    setMeals((prev) => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  }

  function addFood(mealIdx: number) {
    setMeals((prev) => prev.map((m, i) =>
      i === mealIdx ? { ...m, foods: [...m.foods, { ...EMPTY_FOOD }] } : m
    ));
  }

  function removeFood(mealIdx: number, foodIdx: number) {
    setMeals((prev) => prev.map((m, i) =>
      i === mealIdx ? { ...m, foods: m.foods.filter((_, j) => j !== foodIdx) } : m
    ));
  }

  function updateFood(mealIdx: number, foodIdx: number, patch: Partial<FoodInput>) {
    setMeals((prev) => prev.map((m, i) =>
      i === mealIdx
        ? { ...m, foods: m.foods.map((f, j) => j === foodIdx ? { ...f, ...patch } : f) }
        : m
    ));
  }

  function setMealType(mealIdx: number, t: string) {
    const key = t as MealType;
    const meta = MEAL_TYPE_META[key] ?? { label_pt: t, label_en: t };
    updateMeal(mealIdx, {
      meal_type: key,
      name: meals[mealIdx].name || meta.label_pt,
    });
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  function mealTotals(meal: MealInput) {
    return meal.foods.reduce(
      (acc, f) => ({
        calories:  acc.calories  + (parseFloat(f.calories)  || 0),
        protein_g: acc.protein_g + (parseFloat(f.protein_g) || 0),
        carbs_g:   acc.carbs_g   + (parseFloat(f.carbs_g)   || 0),
        fat_g:     acc.fat_g     + (parseFloat(f.fat_g)     || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );
  }

  const dailyTotals = meals.reduce(
    (acc, m) => {
      const t = mealTotals(m);
      return {
        calories:  acc.calories  + t.calories,
        protein_g: acc.protein_g + t.protein_g,
        carbs_g:   acc.carbs_g   + t.carbs_g,
        fat_g:     acc.fat_g     + t.fat_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!name.trim()) { setError("O nome do plano é obrigatório."); return; }
    if (meals.length === 0) { setError("Adiciona pelo menos uma refeição."); return; }

    setSaving(true); setError(null);

    const body = {
      client_id: clientId || null,
      name:      name.trim(),
      goal,
      notes:     notes || null,
      meals: meals.map((m, mi) => ({
        meal_type:   m.meal_type,
        name:        m.name || (MEAL_TYPE_META[m.meal_type]?.label_pt ?? m.meal_type),
        order_index: mi,
        foods: m.foods
          .filter((f) => f.food_name.trim())
          .map((f, fi) => ({
            food_name:   f.food_name.trim(),
            quantity:    f.quantity.trim() || null,
            calories:    parseFloat(f.calories)  || null,
            protein_g:   parseFloat(f.protein_g) || null,
            carbs_g:     parseFloat(f.carbs_g)   || null,
            fat_g:       parseFloat(f.fat_g)     || null,
            notes:       f.notes.trim() || null,
            order_index: fi,
          })),
      })),
    };

    try {
      const res = await fetch("/api/meal-plans", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { id?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao guardar.");
        setSaving(false);
        return;
      }

      startTransition(() => {
        router.push("/coach/meal-plans");
        router.refresh();
      });
    } catch {
      setError("Erro de rede. Tenta novamente.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Plan metadata */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm uppercase tracking-widest text-zinc-400">
          Detalhes do plano
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nome do plano *</label>
            <input
              className="input w-full"
              placeholder="Ex: Plano de definição — Semana 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Cliente</label>
            <select
              className="input w-full"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Sem cliente atribuído</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Goal toggle */}
        <div>
          <label className="label">Objetivo</label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors
                  ${goal === g.value
                    ? "bg-brand-gold text-black border-brand-gold"
                    : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500"
                  }`}
              >
                {g.label_pt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notas gerais (opcional)</label>
          <textarea
            className="input w-full min-h-[72px] resize-none"
            placeholder="Instruções gerais, restrições alimentares, objetivo calórico..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Daily totals summary */}
      {(dailyTotals.calories > 0 || dailyTotals.protein_g > 0) && (
        <div className="card p-4">
          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-3">
            Total diário estimado
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center bg-zinc-800/50 rounded-xl py-2.5">
              <p className="text-brand-gold font-bold text-lg leading-tight">{Math.round(dailyTotals.calories)}</p>
              <p className="text-zinc-600 text-[10px]">kcal</p>
            </div>
            <div className="text-center bg-zinc-800/50 rounded-xl py-2.5">
              <p className="text-blue-400 font-bold text-lg leading-tight">{Math.round(dailyTotals.protein_g)}g</p>
              <p className="text-zinc-600 text-[10px]">prot</p>
            </div>
            <div className="text-center bg-zinc-800/50 rounded-xl py-2.5">
              <p className="text-orange-400 font-bold text-lg leading-tight">{Math.round(dailyTotals.carbs_g)}g</p>
              <p className="text-zinc-600 text-[10px]">hid</p>
            </div>
            <div className="text-center bg-zinc-800/50 rounded-xl py-2.5">
              <p className="text-pink-400 font-bold text-lg leading-tight">{Math.round(dailyTotals.fat_g)}g</p>
              <p className="text-zinc-600 text-[10px]">gord</p>
            </div>
          </div>
        </div>
      )}

      {/* Meals */}
      {meals.map((meal, mi) => {
        const mt = mealTotals(meal);
        const meta = MEAL_TYPE_META[meal.meal_type];

        return (
          <div key={mi} className="card p-5 space-y-4">
            {/* Meal header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest shrink-0">
                  Tipo
                </p>
                <select
                  className="input text-sm py-1.5 flex-1 min-w-0"
                  value={meal.meal_type}
                  onChange={(e) => setMealType(mi, e.target.value)}
                >
                  {(Object.entries(MEAL_TYPE_META) as [MealType, { label_pt: string }][]).map(([type, m]) => (
                    <option key={type} value={type}>{m.label_pt}</option>
                  ))}
                </select>
              </div>
              {meals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMeal(mi)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm shrink-0"
                >
                  Remover
                </button>
              )}
            </div>

            {/* Meal name */}
            <div>
              <label className="label">Nome da refeição</label>
              <input
                className="input w-full"
                placeholder={meta.label_pt}
                value={meal.name}
                onChange={(e) => updateMeal(mi, { name: e.target.value })}
              />
            </div>

            {/* Meal totals (if any data) */}
            {mt.calories > 0 && (
              <div className="flex gap-3 text-xs flex-wrap">
                <span className="text-brand-gold font-semibold">{Math.round(mt.calories)} kcal</span>
                <span className="text-blue-400">P: {Math.round(mt.protein_g)}g</span>
                <span className="text-orange-400">C: {Math.round(mt.carbs_g)}g</span>
                <span className="text-pink-400">G: {Math.round(mt.fat_g)}g</span>
              </div>
            )}

            {/* Foods */}
            <div className="space-y-3">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest">Alimentos</p>
              {meal.foods.map((food, fi) => (
                <div
                  key={fi}
                  className="rounded-xl p-3 space-y-2.5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1 text-sm"
                      placeholder="Nome do alimento"
                      value={food.food_name}
                      onChange={(e) => updateFood(mi, fi, { food_name: e.target.value })}
                    />
                    {meal.foods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFood(mi, fi)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Row 1: Quantidade + Kcal */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500 block mb-1">
                        Quantidade
                      </label>
                      <input
                        className="input text-sm w-full"
                        placeholder="Ex: 100g, 1 unid."
                        value={food.quantity}
                        onChange={(e) => updateFood(mi, fi, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-brand-gold block mb-1">
                        Kcal
                      </label>
                      <input
                        type="number" min="0"
                        className="input text-sm w-full"
                        placeholder="0"
                        value={food.calories}
                        onChange={(e) => updateFood(mi, fi, { calories: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Row 2: Macros */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 block mb-1">
                        Prot (g)
                      </label>
                      <input
                        type="number" min="0" step="0.1"
                        className="input text-sm w-full"
                        placeholder="0"
                        value={food.protein_g}
                        onChange={(e) => updateFood(mi, fi, { protein_g: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-orange-400 block mb-1">
                        Hid (g)
                      </label>
                      <input
                        type="number" min="0" step="0.1"
                        className="input text-sm w-full"
                        placeholder="0"
                        value={food.carbs_g}
                        onChange={(e) => updateFood(mi, fi, { carbs_g: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-pink-400 block mb-1">
                        Gord (g)
                      </label>
                      <input
                        type="number" min="0" step="0.1"
                        className="input text-sm w-full"
                        placeholder="0"
                        value={food.fat_g}
                        onChange={(e) => updateFood(mi, fi, { fat_g: e.target.value })}
                      />
                    </div>
                  </div>

                  <input
                    className="input text-xs w-full"
                    placeholder="Notas sobre este alimento (opcional)"
                    value={food.notes}
                    onChange={(e) => updateFood(mi, fi, { notes: e.target.value })}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => addFood(mi)}
                className="w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-dashed border-zinc-800 hover:border-zinc-600"
              >
                + Adicionar alimento
              </button>
            </div>
          </div>
        );
      })}

      {/* Add meal button */}
      <button
        type="button"
        onClick={addMeal}
        className="w-full py-3 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors border border-dashed border-zinc-800 hover:border-zinc-600"
      >
        + Adicionar refeição
      </button>

      {error && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors border border-zinc-800 sm:border-transparent"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full sm:w-auto text-sm py-3 sm:py-2 disabled:opacity-50"
        >
          {saving ? "A guardar..." : "Guardar plano"}
        </button>
      </div>
    </div>
  );
}
