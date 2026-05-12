"use client";

import { useState } from "react";
import MuscleMap from "@/components/client/MuscleMap";

interface Props {
  exerciseNames: string[];
  loggedNames: string[];
}

export default function CollapsibleMuscleMap({ exerciseNames, loggedNames }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
        style={{
          background: open
            ? "linear-gradient(160deg,#1a1a1a 0%,#111111 100%)"
            : "rgba(18,18,20,0.9)",
          border: open
            ? "1px solid rgba(201,168,76,0.2)"
            : "1px solid rgba(63,63,70,0.4)",
          borderBottomLeftRadius: open ? 0 : undefined,
          borderBottomRightRadius: open ? 0 : undefined,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">💪</span>
          <div className="text-left">
            <p className="text-white font-semibold text-sm leading-tight">Músculos activos</p>
            <p className="text-zinc-600 text-xs mt-0.5">
              {exerciseNames.length > 0
                ? `${exerciseNames.length} exercício${exerciseNames.length > 1 ? "s" : ""} esta semana`
                : "Sem plano activo"}
            </p>
          </div>
        </div>
        <span
          className="text-zinc-500 text-xs font-semibold transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", display:"inline-block" }}
        >
          ▼
        </span>
      </button>

      {/* Collapsible body */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? "2000px" : "0px",
          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
          borderLeft: "1px solid rgba(201,168,76,0.2)",
          borderRight: "1px solid rgba(201,168,76,0.2)",
          borderBottom: open ? "1px solid rgba(201,168,76,0.2)" : "none",
          borderRadius: "0 0 1rem 1rem",
        }}
      >
        <MuscleMap exerciseNames={exerciseNames} loggedNames={loggedNames} />
      </div>
    </div>
  );
}
