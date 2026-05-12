"use client";

import type { WeeklyCheckin } from "@/lib/supabase/types";

interface Props {
  checkins: WeeklyCheckin[];
}

type Metric = "weight_kg" | "waist_cm" | "chest_cm" | "arm_cm";

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: "weight_kg", label: "Peso", unit: "kg", color: "#C9A84C" },
  { key: "waist_cm", label: "Cintura", unit: "cm", color: "#60a5fa" },
  { key: "chest_cm", label: "Peito", unit: "cm", color: "#a78bfa" },
  { key: "arm_cm", label: "Braço", unit: "cm", color: "#34d399" },
];

function MiniChart({
  data,
  color,
  label,
  unit,
}: {
  data: { date: string; value: number }[];
  color: string;
  label: string;
  unit: string;
}) {
  if (data.length < 2) return null;

  const W = 280;
  const H = 80;
  const PAD = { top: 8, right: 8, bottom: 20, left: 32 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * cW,
    y: PAD.top + cH - ((d.value - min) / range) * cH,
    value: d.value,
    date: d.date,
  }));

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fill = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + cH).toFixed(1)} L ${PAD.left} ${(PAD.top + cH).toFixed(1)} Z`;

  const diff = values[values.length - 1] - values[0];
  const sign = diff > 0 ? "+" : "";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <span className="text-xs font-semibold" style={{ color: diff <= 0 ? "#4ade80" : "#f87171" }}>
          {sign}{diff.toFixed(1)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        {[0, 0.5, 1].map((t) => {
          const y = PAD.top + cH * (1 - t);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="#27272a" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#52525b" fontSize="7">
                {(min + range * t).toFixed(0)}
              </text>
            </g>
          );
        })}
        <path d={fill} fill={color} fillOpacity="0.07" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="2.5" fill={color} />
            <text x={p.x} y={PAD.top + cH + 14} textAnchor="middle" fill="#52525b" fontSize="7">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-right text-xs mt-1" style={{ color }}>
        {values[values.length - 1]} {unit}
      </p>
    </div>
  );
}

export default function MeasurementCharts({ checkins }: Props) {
  const sorted = [...checkins]
    .filter((c) => c.weight_kg || c.waist_cm || c.chest_cm || c.arm_cm)
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8);

  const hasData = METRICS.some((m) => sorted.filter((c) => c[m.key] != null).length >= 2);
  if (!hasData) return null;

  return (
    <div>
      <h2 className="text-white font-semibold mb-4">Evolução das medidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METRICS.map((m) => {
          const data = sorted
            .filter((c) => c[m.key] != null)
            .map((c) => ({
              date: new Date(c.week_start + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" }),
              value: c[m.key] as number,
            }));
          return (
            <MiniChart key={m.key} data={data} color={m.color} label={m.label} unit={m.unit} />
          );
        })}
      </div>
    </div>
  );
}
