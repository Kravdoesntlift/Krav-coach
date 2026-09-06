"use client";

import { useState, useTransition } from "react";
import { createProgram } from "@/app/coach/plans/actions";

const WEEK_OPTIONS = [4, 8, 12] as const;

export default function CreateProgramButton({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [weeks, setWeeks] = useState<4 | 8 | 12>(4);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleCreate() {
    startTransition(async () => {
      const result = await createProgram(planId, weeks);
      if (result?.success) {
        setDone(true);
        setTimeout(() => { setOpen(false); setDone(false); }, 1500);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        title="Criar programa multi-semana"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="9" y1="16" x2="15" y2="16"/><line x1="12" y1="13" x2="12" y2="19"/>
        </svg>
        Programa
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-5"
            style={{ background: "#111113", border: "1px solid rgba(201,168,76,0.28)" }}
          >
            <div>
              <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase mb-1">Criar Programa</p>
              <h2 className="text-white font-black text-lg">Quantas semanas?</h2>
              <p className="text-zinc-500 text-sm mt-1">Este plano será duplicado para as semanas seguintes.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {WEEK_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeeks(w)}
                  className="py-3 rounded-2xl font-bold text-sm transition-all"
                  style={weeks === w
                    ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }
                    : { background: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {w} sem.
                </button>
              ))}
            </div>

            <p className="text-zinc-600 text-xs text-center">
              Serão criados {weeks} planos semanais consecutivos.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-none px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isPending || done}
                className="flex-1 py-3 rounded-2xl font-bold text-black text-sm transition-all disabled:opacity-60 active:scale-95"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {done ? "✓ Criado!" : isPending ? "A criar..." : `Criar ${weeks} semanas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
