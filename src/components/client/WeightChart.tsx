"use client";

import type { WeeklyCheckin } from "@/lib/supabase/types";

interface Props {
  checkins: WeeklyCheckin[];
}

export default function WeightChart({ checkins }: Props) {
  // Only entries with weight, sorted oldest → newest
  const data = checkins
    .filter((c) => c.weight_kg != null)
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8);

  if (data.length < 2) return null;

  const weights = data.map((d) => d.weight_kg as number);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const W = 560;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Points
  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - ((( d.weight_kg as number) - minW) / range) * chartH,
    weight: d.weight_kg as number,
    date: new Date(d.week_start + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" }),
  }));

  // SVG path
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Fill area
  const fill = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const diff = weights[weights.length - 1] - weights[0];
  const diffSign = diff > 0 ? "+" : "";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Evolução do Peso</h3>
        <span className={`text-sm font-semibold ${diff < 0 ? "text-green-400" : diff > 0 ? "text-red-400" : "text-gray-400"}`}>
          {diffSign}{diff.toFixed(1)} kg
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "120px" }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((t) => {
          const y = PAD.top + chartH * (1 - t);
          const val = (minW + range * t).toFixed(1);
          return (
            <g key={t}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke="#27272a" strokeWidth="1"
              />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#71717a" fontSize="9">
                {val}
              </text>
            </g>
          );
        })}

        {/* Fill */}
        <path d={fill} fill="#C9A84C" fillOpacity="0.08" />

        {/* Line */}
        <path d={path} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points + labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#C9A84C" />
            <text
              x={p.x}
              y={PAD.top + chartH + 16}
              textAnchor="middle"
              fill="#52525b"
              fontSize="8"
            >
              {p.date}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>{data[0].weight_kg} kg</span>
        <span className="text-gray-400">{data[data.length - 1].weight_kg} kg atual</span>
      </div>
    </div>
  );
}
