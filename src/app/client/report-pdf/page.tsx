"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load the PDF generator (large client-side bundle)
const PDFGenerator = dynamic(() => import("./PDFGenerator"), { ssr: false, loading: () => null });

export default function ReportPDFPage() {
  const now   = new Date();
  const curYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  // Build last 6 months as options
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return { ym, label };
  });

  const [selected, setSelected] = useState(curYM);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">Relatório Mensal</h1>
        <p className="text-gray-400 text-sm mt-1">Exporta o teu progresso em PDF</p>
      </div>

      <div className="card p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest block">
            Mês do relatório
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {months.map(({ ym, label }) => (
              <button
                key={ym}
                onClick={() => setSelected(ym)}
                className={`px-3 py-3 rounded-xl text-sm font-medium text-left transition-colors capitalize ${
                  selected === ym
                    ? "bg-brand-gold text-black font-bold"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl px-4 py-3 space-y-1"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
        >
          <p className="text-brand-gold text-xs font-semibold">O relatório inclui:</p>
          <ul className="text-zinc-400 text-xs space-y-1 mt-1.5">
            {[
              "Resumo de treinos completados",
              "Evolução de peso e energia",
              "Recordes pessoais do mês",
              "Notas e observações dos check-ins",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-brand-gold">·</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <PDFGenerator month={selected} />
      </div>
    </div>
  );
}
