"use client";

import { useState } from "react";
import StreakCalendar from "@/components/client/StreakCalendar";

interface ExercisePoint { date: string; topSet: number; volume: number; doneSets: number }
interface Measurement { week_start: string; weight_kg: number | null; waist_cm: number | null; chest_cm: number | null; arm_cm: number | null }

export interface TimelineEvent {
  type: "workout" | "pr" | "checkin" | "weight" | "photo";
  date: string; // ISO date string
  label: string; // main text
  sub?: string;  // secondary info
  value?: string; // e.g., "100 kg" or "−2kg"
  positive?: boolean; // for color coding
}

interface Props {
  exercises: { name: string; points: ExercisePoint[] }[];
  measurements: Measurement[];
  completedDates: string[];
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  timeline: TimelineEvent[];
}

const MEASURE_GUIDES = [
  {
    key: "weight_kg",
    label: "Peso",
    unit: "kg",
    icon: "⚖️",
    howTo: "De manhã, em jejum, após ir à casa de banho. Sem roupa ou com roupa leve.",
    color: "#C9A84C",
  },
  {
    key: "waist_cm",
    label: "Cintura",
    unit: "cm",
    icon: "📏",
    howTo: "Mede ao nível do umbigo, expirado o ar. Fita paralela ao chão, sem apertar.",
    color: "#60a5fa",
  },
  {
    key: "chest_cm",
    label: "Peito",
    unit: "cm",
    icon: "📐",
    howTo: "Com os braços levantados, mede ao nível dos mamilos. Inspira normalmente.",
    color: "#a78bfa",
  },
  {
    key: "arm_cm",
    label: "Braço",
    unit: "cm",
    icon: "💪",
    howTo: "Com o braço relaxado, mede o ponto mais largo do bícep. Braço dominante.",
    color: "#34d399",
  },
];

export default function ProgressTabs({ exercises, measurements, completedDates, currentStreak, longestStreak, totalWorkouts, timeline }: Props) {
  const [tab, setTab] = useState<"timeline" | "force" | "measures" | "streak">("timeline");

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">Progressão</h1>
        <p className="text-gray-400 text-sm mt-1">Acompanha a tua evolução</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 overflow-x-auto">
        <button
          onClick={() => setTab("timeline")}
          className={`flex-none px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            tab === "timeline" ? "bg-brand-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          📅 Timeline
        </button>
        <button
          onClick={() => setTab("force")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            tab === "force" ? "bg-brand-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Força
        </button>
        <button
          onClick={() => setTab("streak")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            tab === "streak" ? "bg-brand-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          {currentStreak > 0 ? `🔥 ${currentStreak}` : "Streak"}
        </button>
        <button
          onClick={() => setTab("measures")}
          className={`flex-none px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            tab === "measures" ? "bg-brand-gold text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Medidas
        </button>
      </div>

      {tab === "timeline" && (
        <TimelineTab events={timeline} />
      )}

      {tab === "force" && (
        <ForceTab exercises={exercises} />
      )}

      {tab === "streak" && (
        <StreakCalendar
          completedDates={completedDates}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalWorkouts={totalWorkouts}
        />
      )}

      {tab === "measures" && (
        <MeasuresTab measurements={measurements} />
      )}
    </div>
  );
}

// ─── Timeline tab ─────────────────────────────────────────────────────────────

const DOT_COLORS: Record<TimelineEvent["type"], string> = {
  workout: "bg-green-500",
  pr: "bg-brand-gold",
  checkin: "bg-blue-400",
  weight: "bg-zinc-400",
  photo: "bg-purple-400",
};

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card p-12 text-center space-y-3">
        <p className="text-4xl">📅</p>
        <p className="text-white font-semibold">A tua linha do tempo está vazia</p>
        <p className="text-gray-500 text-sm">
          Completa treinos, faz check-ins semanais e regista recordes pessoais para ver a tua evolução aqui.
        </p>
      </div>
    );
  }

  // Group by month (YYYY-MM)
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const monthKey = event.date.slice(0, 7);
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey)!.push(event);
  }

  function formatMonth(key: string) {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  }

  function formatDate(iso: string) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([monthKey, monthEvents]) => (
        <div key={monthKey} className="space-y-1">
          {/* Month header */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 pb-2 capitalize">
            {formatMonth(monthKey)}
          </p>

          {/* Events */}
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-zinc-700" />

            <div className="space-y-2">
              {monthEvents.map((event, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[18px] top-3.5 w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLORS[event.type]}`}
                  />

                  {/* Card */}
                  <div className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-gray-500 text-[11px] leading-none mb-0.5">
                        {formatDate(event.date)}
                      </p>
                      <p className="text-white text-sm font-medium leading-tight truncate">
                        {event.label}
                      </p>
                      {event.sub && (
                        <p className="text-gray-400 text-xs mt-0.5 leading-tight">{event.sub}</p>
                      )}
                    </div>
                    {event.value && (
                      <span
                        className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                          event.positive === true
                            ? "bg-green-500/20 text-green-400"
                            : event.positive === false
                            ? "bg-red-500/20 text-red-400"
                            : "bg-zinc-800 text-gray-300"
                        }`}
                      >
                        {event.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Force tab ───────────────────────────────────────────────────────────────

function ForceTab({ exercises }: { exercises: { name: string; points: ExercisePoint[] }[] }) {
  if (exercises.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">Ainda sem registos de treino.</p>
        <p className="text-gray-600 text-sm mt-2">
          Durante o treino, clica em ✎ em cada exercício para registar os pesos usados.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {exercises.map(({ name, points }) => (
        <ExerciseCard key={name} name={name} points={points} />
      ))}
    </div>
  );
}

function ExerciseCard({ name, points }: { name: string; points: ExercisePoint[] }) {
  const [metric, setMetric] = useState<"volume" | "topset">("volume");
  const latest = points[points.length - 1];
  const first = points[0];

  const vals = points.map((p) => metric === "volume" ? p.volume : p.topSet);
  const diffRaw = points.length > 1 ? vals[vals.length - 1] - vals[0] : 0;
  const improved = diffRaw > 0;

  const W = 300, H = 80, PAD = 8;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = vals.map((v, i) => ({
    x: PAD + (i / Math.max(vals.length - 1, 1)) * (W - PAD * 2),
    y: PAD + ((maxV - v) / range) * (H - PAD * 2),
  }));
  const pathD = pts.length > 1 ? `M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}` : null;
  const areaD = pathD ? `${pathD} L ${pts[pts.length-1].x},${H} L ${pts[0].x},${H} Z` : null;
  const gradId = `grad-${name.replace(/\W/g, "")}-${metric}`;

  const latestVal = metric === "volume" ? latest.volume : latest.topSet;
  const diffLabel = metric === "volume"
    ? `${diffRaw >= 0 ? "+" : ""}${Math.round(diffRaw)} kg`
    : `${diffRaw >= 0 ? "+" : ""}${diffRaw} kg`;
  const valLabel = metric === "volume"
    ? latestVal >= 1000 ? `${(latestVal / 1000).toFixed(1)}t` : `${Math.round(latestVal)} kg`
    : `${latestVal} kg`;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{points.length} sessão{points.length !== 1 ? "ões" : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-brand-gold font-bold text-xl leading-none">{valLabel}</p>
          {diffRaw !== 0 && points.length > 1 && (
            <p className={`text-xs mt-0.5 ${improved ? "text-green-400" : "text-red-400"}`}>{diffLabel}</p>
          )}
        </div>
      </div>

      {/* Metric toggle */}
      <div className="flex gap-1 mb-3 bg-zinc-800 rounded-lg p-0.5">
        {([
          { key: "volume", label: "Volume total" },
          { key: "topset", label: "Top set" },
        ] as const).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMetric(opt.key)}
            className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${
              metric === opt.key ? "bg-zinc-600 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {pathD && (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill={`url(#${gradId})`} />}
          <path d={pathD} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#C9A84C" />)}
        </svg>
      )}

      {/* Metric description */}
      <p className="text-gray-600 text-[11px] mt-1">
        {metric === "volume"
          ? "Volume = séries concluídas × reps × kg por sessão"
          : "Top set = maior peso levantado numa série"}
      </p>

      {points.length > 1 && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">
            {new Date(first.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
          </span>
          <span className="text-xs text-gray-600">
            {new Date(latest.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Measures tab ─────────────────────────────────────────────────────────────

function MeasuresTab({ measurements }: { measurements: Measurement[] }) {
  const [showGuide, setShowGuide] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* How to measure tip */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-gold text-sm">ℹ</span>
          <p className="text-white text-sm font-semibold">Como medir corretamente</p>
        </div>
        <div className="space-y-2">
          {MEASURE_GUIDES.map((g) => (
            <div key={g.key}>
              <button
                onClick={() => setShowGuide(showGuide === g.key ? null : g.key)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{g.icon}</span>
                  <span className="text-gray-300 text-sm">{g.label}</span>
                </div>
                <span className="text-gray-600 text-xs">{showGuide === g.key ? "▲" : "▼"}</span>
              </button>
              {showGuide === g.key && (
                <p className="text-gray-500 text-xs leading-relaxed pb-2 pl-7">
                  {g.howTo}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts per metric */}
      {MEASURE_GUIDES.map((guide) => {
        const pts = measurements
          .map((m) => ({ date: m.week_start, value: m[guide.key as keyof Measurement] as number | null }))
          .filter((p) => p.value !== null) as { date: string; value: number }[];

        if (pts.length === 0) {
          return (
            <div key={guide.key} className="card p-4 flex items-center gap-3 opacity-50">
              <span className="text-xl">{guide.icon}</span>
              <div>
                <p className="text-gray-400 text-sm font-medium">{guide.label}</p>
                <p className="text-gray-600 text-xs">Sem dados — preenche no check-in semanal</p>
              </div>
            </div>
          );
        }

        const latest = pts[pts.length - 1];
        const first = pts[0];
        const diff = pts.length > 1 ? +(latest.value - first.value).toFixed(1) : null;

        const W = 300, H = 70, PAD = 8;
        const vals = pts.map((p) => p.value);
        const minV = Math.min(...vals) - 1;
        const maxV = Math.max(...vals) + 1;
        const range = maxV - minV || 1;
        const svgPts = pts.map((p, i) => ({
          x: PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2),
          y: PAD + ((maxV - p.value) / range) * (H - PAD * 2),
        }));
        const pathD = svgPts.length > 1 ? `M ${svgPts.map(p => `${p.x},${p.y}`).join(" L ")}` : null;
        const areaD = pathD ? `${pathD} L ${svgPts[svgPts.length-1].x},${H} L ${svgPts[0].x},${H} Z` : null;
        const gId = `g-${guide.key}`;

        return (
          <div key={guide.key} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{guide.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{guide.label}</p>
                  <p className="text-gray-500 text-xs">{pts.length} medição{pts.length !== 1 ? "ões" : ""}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl leading-none" style={{ color: guide.color }}>
                  {latest.value} {guide.unit}
                </p>
                {diff !== null && diff !== 0 && (
                  <p className={`text-xs mt-0.5 ${diff < 0 ? "text-green-400" : "text-red-400"}`}>
                    {diff > 0 ? "+" : ""}{diff} {guide.unit}
                  </p>
                )}
                {diff === 0 && pts.length > 1 && (
                  <p className="text-gray-500 text-xs mt-0.5">Sem alteração</p>
                )}
              </div>
            </div>
            {pathD && (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14">
                <defs>
                  <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={guide.color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={guide.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {areaD && <path d={areaD} fill={`url(#${gId})`} />}
                <path d={pathD} fill="none" stroke={guide.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {svgPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={guide.color} />)}
              </svg>
            )}
            {pts.length > 1 && (
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">
                  {new Date(first.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(latest.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
