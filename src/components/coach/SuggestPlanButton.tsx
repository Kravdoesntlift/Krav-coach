"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes: string;
}

interface PlanDay {
  day_of_week: number;
  label: string;
  is_rest: boolean;
  exercises: Exercise[];
}

interface SuggestedPlan {
  name: string;
  days: PlanDay[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SuggestPlanButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<SuggestedPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = (await res.json()) as { plan?: SuggestedPlan; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao gerar plano.");
      } else if (data.plan) {
        setPlan(data.plan);
        setShowModal(true);
      }
    } catch {
      setError("Erro de rede. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleUsePlan() {
    if (!plan) return;
    sessionStorage.setItem("ai_suggested_plan", JSON.stringify(plan));
    router.push(`/coach/plans/new?client=${clientId}&suggest=true`);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:bg-[#C9A84C]/10 disabled:opacity-50 disabled:pointer-events-none"
        style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            A gerar...
          </>
        ) : (
          <>
            <span>✨</span>
            Gerar plano com IA
          </>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* Modal */}
      {showModal && plan && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.80)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            style={{
              background: "linear-gradient(160deg, rgba(201,168,76,0.06) 0%, #0a0a0c 100%)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mb-1">
                  Plano gerado por IA
                </p>
                <h2 className="text-white font-black text-lg leading-snug">{plan.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors text-lg shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Days */}
            <div className="space-y-3">
              {plan.days.map((day) => (
                <div
                  key={day.day_of_week}
                  className="rounded-2xl p-4 space-y-2"
                  style={{
                    background: day.is_rest
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(201,168,76,0.05)",
                    border: day.is_rest
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(201,168,76,0.15)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold text-sm">{day.label}</p>
                    {day.is_rest && (
                      <span className="text-xs text-zinc-600 font-medium">Descanso</span>
                    )}
                  </div>
                  {!day.is_rest && day.exercises.length > 0 && (
                    <ul className="space-y-1.5 pt-1">
                      {day.exercises.map((ex, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0 mt-0.5"
                            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                          >
                            {i + 1}
                          </span>
                          <span>
                            <span className="text-zinc-200 font-semibold">{ex.name}</span>
                            {" — "}
                            {ex.sets} séries × {ex.reps}
                            {ex.notes ? ` · ${ex.notes}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-none px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-700 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleUsePlan}
                className="flex-1 py-3 rounded-2xl font-bold text-black text-sm transition-all active:scale-95 hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                Usar este plano
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
