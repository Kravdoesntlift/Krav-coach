"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NutritionLog, ClientNutritionGoals } from "@/lib/supabase/types";

// ─── TDEE calculation ─────────────────────────────────────────────────────────
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentário (sem exercício)",
  light:     "Ligeiro (1-3x/semana)",
  moderate:  "Moderado (3-5x/semana)",
  active:    "Activo (6-7x/semana)",
  very_active: "Muito activo (2x/dia)",
};
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
const GOAL_LABELS: Record<string, string> = {
  cut: "Perder gordura",
  maintenance: "Manutenção",
  bulk: "Ganhar massa",
};

function calcTDEE(g: ClientNutritionGoals): { calories: number; protein: number; carbs: number; fat: number } | null {
  if (!g.weight_kg || !g.height_cm || !g.age || !g.sex) return null;
  const bmr = g.sex === "M"
    ? 88.362 + (13.397 * g.weight_kg) + (4.799 * g.height_cm) - (5.677 * g.age)
    : 447.593 + (9.247 * g.weight_kg) + (3.098 * g.height_cm) - (4.330 * g.age);
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[g.activity_level] ?? 1.55);
  const adj = g.goal === "cut" ? -400 : g.goal === "bulk" ? 300 : 0;
  const calories = Math.round(tdee + adj);
  const protein  = Math.round(g.weight_kg * 2.0);
  const fat      = Math.round((calories * 0.25) / 9);
  const carbs    = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs: Math.max(0, carbs), fat };
}

// ─── Food search types ────────────────────────────────────────────────────────
interface FoodResult {
  id: number;
  name: string;
  per100g: {
    calories: number | null; protein: number | null; carbs: number | null; fat: number | null;
    fiber: number | null; sugar: number | null; sodium: number | null;
    vit_c: number | null; vit_d: number | null; vit_b12: number | null;
    calcium: number | null; iron: number | null; potassium: number | null; magnesium: number | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MEAL_PRESETS = ["Pequeno-almoço", "Lanche manhã", "Almoço", "Lanche tarde", "Jantar", "Ceia"];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
}

function scale(val: number | null, grams: number): number | null {
  return val != null ? Math.round((val * grams / 100) * 10) / 10 : null;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500 font-semibold uppercase tracking-wide">{label}</span>
        <span className={color}>{current} / {target}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : ""}`}
          style={{ width: `${pct}%`, background: pct >= 100 ? undefined : "linear-gradient(90deg,#E8C96B,#A8893A)" }} />
      </div>
    </div>
  );
}

// ─── Food search modal ────────────────────────────────────────────────────────
function FoodSearch({
  mealName,
  onAdd,
  onClose,
}: {
  mealName: string;
  onAdd: (data: Partial<NutritionLog>) => void;
  onClose: () => void;
}) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [grams, setGrams]       = useState("100");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true); setSearchErr(null);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { foods?: FoodResult[]; error?: string };
        if (data.error) setSearchErr(data.error);
        else setResults(data.foods ?? []);
      } catch {
        setSearchErr("Erro de ligação.");
      } finally { setSearching(false); }
    }, 500);
  }, [query]);

  const g = parseFloat(grams) || 100;
  const p = selected?.per100g;
  const scaled = p ? {
    calories:  scale(p.calories, g),
    protein:   scale(p.protein, g),
    carbs:     scale(p.carbs, g),
    fat:       scale(p.fat, g),
    fiber:     scale(p.fiber, g),
    sugar:     scale(p.sugar, g),
    sodium:    scale(p.sodium, g),
    vit_c:     scale(p.vit_c, g),
    vit_d:     scale(p.vit_d, g),
    vit_b12:   scale(p.vit_b12, g),
    calcium:   scale(p.calcium, g),
    iron:      scale(p.iron, g),
    potassium: scale(p.potassium, g),
    magnesium: scale(p.magnesium, g),
  } : null;

  function handleAdd() {
    if (!selected || !scaled) return;
    onAdd({
      meal_name:    mealName,
      description:  selected.name,
      calories:     scaled.calories != null ? Math.round(scaled.calories) : null,
      protein_g:    scaled.protein  != null ? Math.round(scaled.protein)  : null,
      carbs_g:      scaled.carbs    != null ? Math.round(scaled.carbs)    : null,
      fat_g:        scaled.fat      != null ? Math.round(scaled.fat)      : null,
      fiber_g:      scaled.fiber,
      sugar_g:      scaled.sugar,
      sodium_mg:    scaled.sodium   != null ? Math.round(scaled.sodium)   : null,
      vit_c_mg:     scaled.vit_c,
      vit_d_mcg:    scaled.vit_d,
      vit_b12_mcg:  scaled.vit_b12,
      calcium_mg:   scaled.calcium  != null ? Math.round(scaled.calcium)  : null,
      iron_mg:      scaled.iron,
      potassium_mg: scaled.potassium != null ? Math.round(scaled.potassium) : null,
      magnesium_mg: scaled.magnesium != null ? Math.round(scaled.magnesium) : null,
      food_id:      String(selected.id),
      serving_g:    Math.round(g),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div
        className="mt-auto max-h-[90dvh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-4 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Pesquisar alimento</p>
            <button onClick={onClose} className="text-zinc-600 hover:text-white text-sm transition-colors">Fechar</button>
          </div>

          {/* Search input */}
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Ex: frango, aveia, banana..."
              className="input text-sm pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchErr && <p className="text-red-400 text-xs">{searchErr}</p>}

          {/* Results */}
          {!selected && results.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelected(f)}
                  className="w-full text-left px-3 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <p className="text-white text-sm capitalize">{f.name.toLowerCase()}</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    {f.per100g.calories != null ? `${f.per100g.calories} kcal` : ""}
                    {f.per100g.protein != null ? ` · ${f.per100g.protein}g prot` : ""}
                    {" por 100g"}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Selected food + weight */}
          {selected && (
            <div className="space-y-4">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-brand-gold text-xs"
              >
                ← Voltar à pesquisa
              </button>

              <div className="rounded-xl p-3" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <p className="text-white text-sm font-semibold capitalize">{selected.name.toLowerCase()}</p>
                <p className="text-zinc-500 text-[10px]">por 100g</p>
              </div>

              {/* Grams input */}
              <div>
                <label className="label">Quantidade (gramas)</label>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="input text-sm"
                  min="1" max="2000"
                />
              </div>

              {/* Calculated values */}
              {scaled && (
                <div className="space-y-3">
                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "kcal",    val: scaled.calories,  color: "text-brand-gold" },
                      { label: "Prot",    val: scaled.protein != null ? `${scaled.protein}g` : null,  color: "text-blue-400" },
                      { label: "Hid",     val: scaled.carbs   != null ? `${scaled.carbs}g`   : null,  color: "text-orange-400" },
                      { label: "Gord",    val: scaled.fat     != null ? `${scaled.fat}g`     : null,  color: "text-pink-400" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center rounded-xl py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className={`text-sm font-bold ${color}`}>{val ?? "—"}</p>
                        <p className="text-zinc-600 text-[9px]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Micronutrients */}
                  <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">Micronutrientes</p>
                    {[
                      { label: "Fibra",      val: scaled.fiber,     unit: "g" },
                      { label: "Açúcar",     val: scaled.sugar,     unit: "g" },
                      { label: "Sódio",      val: scaled.sodium,    unit: "mg" },
                      { label: "Vitamina C", val: scaled.vit_c,     unit: "mg" },
                      { label: "Vitamina D", val: scaled.vit_d,     unit: "mcg" },
                      { label: "Vitamina B12", val: scaled.vit_b12, unit: "mcg" },
                      { label: "Cálcio",     val: scaled.calcium,   unit: "mg" },
                      { label: "Ferro",      val: scaled.iron,      unit: "mg" },
                      { label: "Potássio",   val: scaled.potassium, unit: "mg" },
                      { label: "Magnésio",   val: scaled.magnesium, unit: "mg" },
                    ].filter((r) => r.val != null && r.val > 0).map(({ label, val, unit }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-zinc-500 text-xs">{label}</span>
                        <span className="text-zinc-300 text-xs font-medium">{val}{unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors"
              >
                Adicionar ao {mealName}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!searching && query.length >= 2 && results.length === 0 && !selected && (
            <p className="text-zinc-600 text-sm text-center py-4">
              Nenhum resultado para &quot;{query}&quot;
            </p>
          )}

          {query.length < 2 && !selected && (
            <p className="text-zinc-700 text-xs text-center py-2">
              Pesquisa em inglês para melhores resultados (ex: &quot;chicken breast&quot;, &quot;oats&quot;, &quot;banana&quot;)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Goals setup modal ────────────────────────────────────────────────────────
function GoalsSetup({ existing, onSave, onClose }: {
  existing: ClientNutritionGoals | null;
  onSave: (g: ClientNutritionGoals) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [weight,   setWeight]   = useState(String(existing?.weight_kg   ?? ""));
  const [height,   setHeight]   = useState(String(existing?.height_cm   ?? ""));
  const [age,      setAge]      = useState(String(existing?.age         ?? ""));
  const [sex,      setSex]      = useState<"M"|"F">(existing?.sex       ?? "M");
  const [activity, setActivity] = useState<ClientNutritionGoals["activity_level"]>(existing?.activity_level ?? "moderate");
  const [goal,     setGoal]     = useState<ClientNutritionGoals["goal"]>(existing?.goal ?? "maintenance");
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setSaving(false); return; }

    const row: Omit<ClientNutritionGoals, "updated_at"> = {
      client_id:      user.user.id,
      goal:           goal,
      weight_kg:      parseFloat(weight) || null,
      height_cm:      parseInt(height)   || null,
      age:            parseInt(age)      || null,
      sex:            sex,
      activity_level: activity,
      target_calories:  null,
      target_protein_g: null,
      target_carbs_g:   null,
      target_fat_g:     null,
    };

    // Calculate targets
    const tdee = calcTDEE({ ...row, updated_at: "" });
    if (tdee) {
      row.target_calories  = tdee.calories;
      row.target_protein_g = tdee.protein;
      row.target_carbs_g   = tdee.carbs;
      row.target_fat_g     = tdee.fat;
    }

    await supabase.from("client_nutrition_goals").upsert(row, { onConflict: "client_id" });
    onSave({ ...row, updated_at: new Date().toISOString() });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div
        className="mt-auto max-h-[90dvh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>
        <div className="px-4 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">Configurar objetivos</p>
              <p className="text-zinc-500 text-xs mt-0.5">Para calcular as tuas necessidades diárias</p>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-white text-sm">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="input" placeholder="70" />
            </div>
            <div>
              <label className="label">Altura (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="input" placeholder="175" />
            </div>
            <div>
              <label className="label">Idade</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="input" placeholder="28" />
            </div>
            <div>
              <label className="label">Sexo</label>
              <div className="flex gap-2 mt-1">
                {(["M", "F"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSex(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${sex === s ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400"}`}>
                    {s === "M" ? "Masculino" : "Feminino"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Nível de actividade</label>
            <div className="space-y-1.5 mt-1">
              {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setActivity(k as ClientNutritionGoals["activity_level"])}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${activity === k ? "bg-brand-gold text-black font-semibold" : "bg-zinc-800/60 text-zinc-400 hover:text-white"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Objetivo</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setGoal(k as ClientNutritionGoals["goal"])}
                  className={`py-3 rounded-xl text-xs font-semibold transition-colors ${goal === k ? "bg-brand-gold text-black" : "bg-zinc-800/60 text-zinc-400 hover:text-white"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-40"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NutritionPage() {
  const supabase = createClient();
  const [logs,    setLogs]    = useState<NutritionLog[]>([]);
  const [goals,   setGoals]   = useState<ClientNutritionGoals | null>(null);
  const [date,    setDate]    = useState(today());
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // UI state
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [activeMeal,     setActiveMeal]     = useState<string | null>(null); // opens food search
  const [showManual,     setShowManual]     = useState(false);

  // Manual form state
  const [mealName,     setMealName]     = useState("");
  const [description,  setDescription]  = useState("");
  const [calories,     setCalories]     = useState("");
  const [protein,      setProtein]      = useState("");
  const [carbs,        setCarbs]        = useState("");
  const [fat,          setFat]          = useState("");
  const [saving,       setSaving]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: logsData }, { data: goalsData }] = await Promise.all([
      supabase.from("nutrition_logs").select("*").eq("logged_at", date).order("created_at"),
      supabase.from("client_nutrition_goals").select("*").eq("client_id", user.id).maybeSingle(),
    ]);

    setLogs(logsData ?? []);
    setGoals(goalsData ?? null);
    setLoading(false);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadData(); }, [loadData]);

  // Totals for the day
  const totals = {
    calories:  logs.reduce((s, l) => s + (l.calories  ?? 0), 0),
    protein:   logs.reduce((s, l) => s + (l.protein_g ?? 0), 0),
    carbs:     logs.reduce((s, l) => s + (l.carbs_g   ?? 0), 0),
    fat:       logs.reduce((s, l) => s + (l.fat_g     ?? 0), 0),
    fiber:     logs.reduce((s, l) => s + (l.fiber_g   ?? 0), 0),
    sodium:    logs.reduce((s, l) => s + (l.sodium_mg ?? 0), 0),
    vit_c:     logs.reduce((s, l) => s + (l.vit_c_mg  ?? 0), 0),
    calcium:   logs.reduce((s, l) => s + (l.calcium_mg ?? 0), 0),
    iron:      logs.reduce((s, l) => s + (l.iron_mg   ?? 0), 0),
  };

  const tdee = goals ? calcTDEE(goals) : null;
  const targets = tdee ?? {
    calories:  goals?.target_calories  ?? 0,
    protein:   goals?.target_protein_g ?? 0,
    carbs:     goals?.target_carbs_g   ?? 0,
    fat:       goals?.target_fat_g     ?? 0,
  };

  async function addFromSearch(mealName: string, data: Partial<NutritionLog>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: inserted } = await supabase.from("nutrition_logs").insert({
      client_id: user.id, logged_at: date, ...data, meal_name: mealName,
    }).select().single();
    if (inserted) setLogs((prev) => [...prev, inserted as NutritionLog]);
    setActiveMeal(null);
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) { setError("Escolhe uma refeição."); return; }
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: inserted } = await supabase.from("nutrition_logs").insert({
      client_id: user.id, logged_at: date,
      meal_name: mealName.trim(),
      description: description.trim() || null,
      calories:  calories ? parseInt(calories) : null,
      protein_g: protein  ? parseInt(protein)  : null,
      carbs_g:   carbs    ? parseInt(carbs)    : null,
      fat_g:     fat      ? parseInt(fat)      : null,
    }).select().single();
    if (inserted) setLogs((prev) => [...prev, inserted as NutritionLog]);
    setMealName(""); setDescription(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setShowManual(false); setSaving(false);
  }

  async function deleteLog(id: string) {
    if (!window.confirm("Apagar este registo?")) return;
    await supabase.from("nutrition_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  function changeDay(delta: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const isToday = date === today();

  return (
    <div className="space-y-5 page-enter">
      {/* Modals */}
      {activeMeal && (
        <FoodSearch
          mealName={activeMeal}
          onAdd={(data) => addFromSearch(activeMeal, data)}
          onClose={() => setActiveMeal(null)}
        />
      )}
      {showGoalsModal && (
        <GoalsSetup
          existing={goals}
          onSave={(g) => { setGoals(g); setShowGoalsModal(false); }}
          onClose={() => setShowGoalsModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nutrição</h1>
          <p className="text-gray-400 text-sm mt-0.5">Regista as tuas refeições e macros diários</p>
        </div>
        <button
          onClick={() => setShowGoalsModal(true)}
          className="text-xs text-zinc-500 hover:text-brand-gold transition-colors mt-1"
        >
          ⚙ Objetivos
        </button>
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDay(-1)} className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors text-lg leading-none">‹</button>
        <div className="text-center">
          <p className="text-white text-sm font-semibold capitalize">{fmtDate(date)}</p>
          {isToday && <p className="text-brand-gold text-[10px]">Hoje</p>}
        </div>
        <button onClick={() => changeDay(1)} disabled={isToday}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:opacity-30 text-lg leading-none">›</button>
      </div>

      {/* Goals / progress bars */}
      {!loading && targets.calories > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white text-xs font-semibold">Progresso diário</p>
            <p className="text-brand-gold text-xs font-bold">{totals.calories} / {targets.calories} kcal</p>
          </div>
          <MacroBar label="Proteína" current={totals.protein} target={targets.protein} color="text-blue-400" />
          <MacroBar label="Hidratos" current={totals.carbs}   target={targets.carbs}   color="text-orange-400" />
          <MacroBar label="Gordura"  current={totals.fat}     target={targets.fat}     color="text-pink-400" />
        </div>
      )}

      {/* No goals set yet */}
      {!loading && !goals && (
        <button
          onClick={() => setShowGoalsModal(true)}
          className="w-full py-3 rounded-xl text-sm transition-colors text-zinc-400 hover:text-white"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px dashed rgba(201,168,76,0.25)" }}
        >
          + Configurar objetivos de nutrição e TDEE
        </button>
      )}

      {/* Add meal buttons */}
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Adicionar refeição</p>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMeal(m)}
              className="py-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowManual((v) => !v)}
          className="w-full py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showManual ? "Cancelar" : "Inserir manualmente (sem pesquisa)"}
        </button>
      </div>

      {/* Manual form */}
      {showManual && (
        <form onSubmit={addManual} className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEAL_PRESETS.map((m) => (
              <button key={m} type="button" onClick={() => setMealName(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mealName === m ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                {m}
              </button>
            ))}
          </div>
          <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="Nome da refeição" className="input text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2} className="input text-sm resize-none" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Calorias (kcal)", val: calories, set: setCalories, color: "text-brand-gold" },
              { label: "Proteína (g)",    val: protein,  set: setProtein,  color: "text-blue-400" },
              { label: "Hidratos (g)",    val: carbs,    set: setCarbs,    color: "text-orange-400" },
              { label: "Gordura (g)",     val: fat,      set: setFat,      color: "text-pink-400" },
            ].map(({ label, val, set, color }) => (
              <div key={label}>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${color} block mb-1`}>{label}</label>
                <input type="number" min="0" value={val} onChange={(e) => set(e.target.value)} placeholder="—" className="input text-sm" />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand-gold text-black text-sm font-bold disabled:opacity-40">
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </form>
      )}

      {/* Logs for the day */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl p-10 text-center space-y-3" style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}>
          <p className="text-4xl">🥗</p>
          <div>
            <p className="text-white font-bold text-sm">Sem registos para este dia</p>
            <p className="text-zinc-500 text-xs mt-1">Clica numa refeição acima para pesquisar alimentos</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{log.meal_name}</p>
                  {log.description && <p className="text-zinc-500 text-xs mt-0.5 capitalize">{log.description}</p>}
                  {log.serving_g && <p className="text-zinc-700 text-[10px]">{log.serving_g}g</p>}
                </div>
                <button onClick={() => deleteLog(log.id)} className="shrink-0 text-zinc-700 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
              {(log.calories || log.protein_g || log.carbs_g || log.fat_g) && (
                <div className="flex gap-3 pt-1 border-t border-zinc-800/60 flex-wrap">
                  {log.calories  != null && <span className="text-brand-gold  text-xs font-semibold">{log.calories} kcal</span>}
                  {log.protein_g != null && <span className="text-blue-400   text-xs">{log.protein_g}g prot</span>}
                  {log.carbs_g   != null && <span className="text-orange-400 text-xs">{log.carbs_g}g hid</span>}
                  {log.fat_g     != null && <span className="text-pink-400   text-xs">{log.fat_g}g gord</span>}
                  {log.fiber_g   != null && <span className="text-green-400  text-xs">{log.fiber_g}g fibra</span>}
                </div>
              )}
              {/* Micronutrients row */}
              {(log.vit_c_mg || log.calcium_mg || log.iron_mg || log.sodium_mg) && (
                <div className="flex gap-3 flex-wrap">
                  {log.sodium_mg   != null && <span className="text-zinc-500 text-[10px]">Sódio {log.sodium_mg}mg</span>}
                  {log.vit_c_mg    != null && <span className="text-zinc-500 text-[10px]">Vit C {log.vit_c_mg}mg</span>}
                  {log.calcium_mg  != null && <span className="text-zinc-500 text-[10px]">Cálcio {log.calcium_mg}mg</span>}
                  {log.iron_mg     != null && <span className="text-zinc-500 text-[10px]">Ferro {log.iron_mg}mg</span>}
                </div>
              )}
            </div>
          ))}

          {/* Day totals at bottom */}
          {totals.sodium > 0 || totals.vit_c > 0 || totals.calcium > 0 ? (
            <div className="card p-3 space-y-1">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">Total do dia — Micronutrientes</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: "Fibra",      val: totals.fiber,   unit: "g" },
                  { label: "Sódio",      val: totals.sodium,  unit: "mg" },
                  { label: "Vitamina C", val: totals.vit_c,   unit: "mg" },
                  { label: "Cálcio",     val: totals.calcium, unit: "mg" },
                  { label: "Ferro",      val: totals.iron,    unit: "mg" },
                ].filter((r) => r.val > 0).map(({ label, val, unit }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-zinc-600 text-xs">{label}</span>
                    <span className="text-zinc-400 text-xs font-medium">{Math.round(val * 10) / 10}{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
