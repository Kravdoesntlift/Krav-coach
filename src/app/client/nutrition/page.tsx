"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NutritionLog } from "@/lib/supabase/types";

const MEAL_PRESETS = ["Pequeno-almoço", "Lanche manhã", "Almoço", "Lanche tarde", "Jantar", "Ceia"];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function MacroBadge({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${color}`}>{value ?? "—"}{value != null ? unit : ""}</p>
      <p className="text-zinc-600 text-[10px]">{label}</p>
    </div>
  );
}

function DayTotals({ logs }: { logs: NutritionLog[] }) {
  const cal  = logs.reduce((s, l) => s + (l.calories  ?? 0), 0);
  const prot = logs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const carb = logs.reduce((s, l) => s + (l.carbs_g   ?? 0), 0);
  const fat  = logs.reduce((s, l) => s + (l.fat_g     ?? 0), 0);
  if (cal + prot + carb + fat === 0) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 grid grid-cols-4 gap-2"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
    >
      <MacroBadge label="kcal"       value={cal  || null} unit=""  color="text-brand-gold" />
      <MacroBadge label="Proteína"   value={prot || null} unit="g" color="text-blue-400"   />
      <MacroBadge label="Hidratos"   value={carb || null} unit="g" color="text-orange-400" />
      <MacroBadge label="Gordura"    value={fat  || null} unit="g" color="text-pink-400"   />
    </div>
  );
}

export default function NutritionPage() {
  const supabase = createClient();
  const [logs, setLogs]       = useState<NutritionLog[]>([]);
  const [date, setDate]       = useState(today());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // form fields
  const [mealName, setMealName]   = useState("");
  const [description, setDescription] = useState("");
  const [calories, setCalories]   = useState("");
  const [protein, setProtein]     = useState("");
  const [carbs, setCarbs]         = useState("");
  const [fat, setFat]             = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("logged_at", date)
      .order("created_at", { ascending: true });
    setLogs(data ?? []);
    setLoading(false);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  function resetForm() {
    setMealName(""); setDescription("");
    setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) { setError("Escolhe uma refeição."); return; }
    setSaving(true); setError(null);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setError("Não autenticado."); setSaving(false); return; }
    const { data: inserted, error: err } = await supabase
      .from("nutrition_logs")
      .insert({
        client_id: user.user.id,
        logged_at: date,
        meal_name: mealName.trim(),
        description: description.trim() || null,
        calories:  calories  ? parseInt(calories)  : null,
        protein_g: protein   ? parseInt(protein)   : null,
        carbs_g:   carbs     ? parseInt(carbs)     : null,
        fat_g:     fat       ? parseInt(fat)       : null,
      })
      .select()
      .single();
    if (err || !inserted) { setError("Erro ao guardar. Tenta novamente."); setSaving(false); return; }
    setLogs((prev) => [...prev, inserted]);
    resetForm();
    setShowForm(false);
    setSaving(false);
  }

  async function deleteLog(id: string) {
    if (!window.confirm("Apagar este registo?")) return;
    await supabase.from("nutrition_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  // Navigate days
  function changeDay(delta: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const isToday = date === today();

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">Nutrição</h1>
        <p className="text-gray-400 text-sm mt-1">Regista as tuas refeições e macros diários</p>
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDay(-1)} className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
          ‹
        </button>
        <div className="text-center">
          <p className="text-white text-sm font-semibold capitalize">{fmtDate(date)}</p>
          {isToday && <p className="text-brand-gold text-[10px]">Hoje</p>}
        </div>
        <button
          onClick={() => changeDay(1)}
          disabled={isToday}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* Daily totals */}
      {!loading && <DayTotals logs={logs} />}

      {/* Add meal button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Adicionar refeição
        </button>
      )}

      {/* Add meal form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Nova refeição</p>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-zinc-600 hover:text-zinc-400 text-xs">
              Cancelar
            </button>
          </div>

          {/* Meal preset pills */}
          <div className="flex flex-wrap gap-2">
            {MEAL_PRESETS.map((m) => (
              <button
                key={m} type="button"
                onClick={() => setMealName(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mealName === m
                    ? "bg-brand-gold text-black"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <input
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Ou escreve o nome da refeição"
            className="input text-sm"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que comeste? (opcional)"
            rows={2}
            className="input text-sm resize-none"
          />

          {/* Macros grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Calorias (kcal)", val: calories, set: setCalories, color: "text-brand-gold" },
              { label: "Proteína (g)",    val: protein,  set: setProtein,  color: "text-blue-400"   },
              { label: "Hidratos (g)",    val: carbs,    set: setCarbs,    color: "text-orange-400" },
              { label: "Gordura (g)",     val: fat,      set: setFat,      color: "text-pink-400"   },
            ].map(({ label, val, set, color }) => (
              <div key={label}>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${color} block mb-1`}>{label}</label>
                <input
                  type="number" min="0" max="9999"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder="—"
                  className="input text-sm"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-40"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </form>
      )}

      {/* Meals list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center space-y-3"
          style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
        >
          <p className="text-4xl">🥗</p>
          <div>
            <p className="text-white font-bold text-sm">Sem registos para este dia</p>
            <p className="text-zinc-500 text-xs mt-1">Adiciona as tuas refeições para acompanhar a nutrição</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{log.meal_name}</p>
                  {log.description && (
                    <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{log.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="shrink-0 text-zinc-700 hover:text-red-400 text-xs transition-colors mt-0.5"
                >
                  ✕
                </button>
              </div>
              {(log.calories || log.protein_g || log.carbs_g || log.fat_g) && (
                <div className="flex gap-4 pt-1 border-t border-zinc-800/60">
                  {log.calories  != null && <span className="text-brand-gold  text-xs font-semibold">{log.calories} kcal</span>}
                  {log.protein_g != null && <span className="text-blue-400   text-xs">{log.protein_g}g prot</span>}
                  {log.carbs_g   != null && <span className="text-orange-400 text-xs">{log.carbs_g}g hid</span>}
                  {log.fat_g     != null && <span className="text-pink-400   text-xs">{log.fat_g}g gord</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
