"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PersonalRecord } from "@/lib/supabase/types";
import Confetti from "@/components/ui/Confetti";
import { haptic, HAPTIC } from "@/lib/haptic";

interface Props {
  clientId: string;
  initialRecords: PersonalRecord[];
}

export default function PersonalRecords({ clientId, initialRecords }: Props) {
  const [records, setRecords] = useState<PersonalRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // Group records by exercise name (best = most recent)
  const grouped = records.reduce<Record<string, PersonalRecord[]>>((acc, r) => {
    if (!acc[r.exercise_name]) acc[r.exercise_name] = [];
    acc[r.exercise_name].push(r);
    return acc;
  }, {});

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("personal_records")
      .insert({
        client_id: clientId,
        exercise_name: exercise.trim(),
        weight_kg: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps) : null,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (data) {
      setRecords((prev) => [data as PersonalRecord, ...prev]);
      setExercise("");
      setWeight("");
      setReps("");
      setNotes("");
      setShowForm(false);
      haptic(HAPTIC.success);
      setCelebrating(true);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("personal_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {celebrating && (
        <Confetti onDone={() => setCelebrating(false)} />
      )}
      {/* Add button */}
      <button
        onClick={() => setShowForm((s) => !s)}
        className="btn-primary text-sm"
      >
        {showForm ? "Cancelar" : "+ Novo registo"}
      </button>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card p-5 space-y-4 animate-fade-in">
          <h2 className="text-white font-semibold">Novo recorde</h2>

          <div>
            <label className="label">Exercício</label>
            <input
              type="text" value={exercise} onChange={(e) => setExercise(e.target.value)}
              className="input" placeholder="ex: Supino, Agachamento, Deadlift..." required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Peso (kg)</label>
              <input
                type="number" step="0.5" min="0" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input" placeholder="ex: 100"
              />
            </div>
            <div className="flex-1">
              <label className="label">Reps</label>
              <input
                type="number" min="1" value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="input" placeholder="ex: 5"
              />
            </div>
          </div>

          <div>
            <label className="label">Notas (opcional)</label>
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="input" placeholder="ex: com pausa, máximo, RPE 9..."
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary text-sm py-2.5 w-full">
            {loading ? "A guardar..." : "Guardar recorde"}
          </button>
        </form>
      )}

      {/* Records grouped by exercise */}
      {Object.keys(grouped).length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center space-y-5"
          style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <span className="text-4xl">🏆</span>
          </div>
          <div>
            <p className="text-white font-bold text-base">Sem recordes ainda</p>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
              Regista o teu primeiro PR e começa a acompanhar a tua evolução de força.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm mx-auto"
          >
            + Registar primeiro PR
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([name, recs]) => {
            const best = recs.reduce((b, r) =>
              (r.weight_kg ?? 0) > (b.weight_kg ?? 0) ? r : b
            );
            return (
              <div key={name} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">{name}</h3>
                  <div className="flex items-center gap-2">
                    {best.weight_kg && (
                      <span className="text-brand-gold font-bold">{best.weight_kg} kg</span>
                    )}
                    {best.reps && (
                      <span className="text-gray-400 text-sm">× {best.reps} reps</span>
                    )}
                    <span className="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">PR</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {recs.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                      <div>
                        <span className="text-gray-300 text-sm">
                          {r.weight_kg ? `${r.weight_kg} kg` : "—"}
                          {r.reps ? ` × ${r.reps}` : ""}
                        </span>
                        {r.notes && <span className="text-gray-600 text-xs ml-2">{r.notes}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-xs">
                          {new Date(r.recorded_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                        </span>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="text-gray-700 hover:text-red-400 text-xs transition-colors"
                        >
                          {deletingId === r.id ? "..." : "×"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
