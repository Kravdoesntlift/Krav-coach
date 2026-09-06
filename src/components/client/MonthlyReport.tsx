"use client";

import { useState } from "react";

interface Props {
  month: string; // "Abril"
  year: number;
  totalWorkouts: number;
  totalPRs: number;
  weightChange: number | null; // kg difference (negative = lost)
  totalCheckins: number;
}

export default function MonthlyReport({ month, year, totalWorkouts, totalPRs, weightChange, totalCheckins }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative border border-brand-gold/40 bg-gradient-to-br from-brand-gold/10 to-transparent rounded-2xl p-5 space-y-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-600 hover:text-white text-sm transition-colors"
      >
        ✕
      </button>

      <div>
        <p className="text-xs text-brand-gold font-semibold uppercase tracking-wide">Resumo do mês</p>
        <h2 className="text-white font-bold text-lg mt-0.5">{month} {year}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-xl p-3 text-center">
          <p className="text-brand-gold font-black text-3xl">{totalWorkouts}</p>
          <p className="text-gray-400 text-xs mt-0.5">treino{totalWorkouts !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-black/30 rounded-xl p-3 text-center">
          <p className="text-brand-gold font-black text-3xl">{totalCheckins}</p>
          <p className="text-gray-400 text-xs mt-0.5">check-in{totalCheckins !== 1 ? "s" : ""}</p>
        </div>
        {totalPRs > 0 && (
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <p className="text-brand-gold font-black text-3xl">{totalPRs}</p>
            <p className="text-gray-400 text-xs mt-0.5">novo{totalPRs !== 1 ? "s" : ""} PR{totalPRs !== 1 ? "s" : ""}</p>
          </div>
        )}
        {weightChange !== null && (
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <p className={`font-black text-3xl ${weightChange < 0 ? "text-green-400" : weightChange > 0 ? "text-orange-400" : "text-gray-400"}`}>
              {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
            </p>
            <p className="text-gray-400 text-xs mt-0.5">variação de peso</p>
          </div>
        )}
      </div>

      <p className="text-gray-300 text-sm">
        {totalWorkouts >= 16
          ? "Mês incrível, és imparável! 🔥"
          : totalWorkouts >= 10
          ? "Excelente consistência! Continua assim 💪"
          : totalWorkouts >= 4
          ? "Bom trabalho! Tenta aumentar a frequência 📈"
          : "Próximo mês vais conseguir ainda mais! 🎯"}
      </p>
    </div>
  );
}
