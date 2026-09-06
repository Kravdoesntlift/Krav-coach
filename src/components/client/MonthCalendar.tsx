// Server component: recebe dados pré-computados do dashboard
export type DayStatus = "completed" | "missed" | "rest" | "future" | "none";

const MONTH_NAMES_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const MONTH_NAMES_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
// Monday-based, PT: S T Q Q S S D | EN: M T W T F S S
const DOW_HEADERS_PT = ["S","T","Q","Q","S","S","D"];
const DOW_HEADERS_EN = ["M","T","W","T","F","S","S"];

interface Props {
  year: number;
  month: number; // 0-indexed
  dayStatuses: Record<string, DayStatus>;
  todayStr: string;
  lang?: "pt" | "en";
}

export default function MonthCalendar({ year, month, dayStatuses, todayStr, lang = "pt" }: Props) {
  const isEN = lang === "en";
  const MONTH_NAMES = isEN ? MONTH_NAMES_EN : MONTH_NAMES_PT;
  const DOW_HEADERS = isEN ? DOW_HEADERS_EN : DOW_HEADERS_PT;

  const firstDay  = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // Monday-based offset (0=Mon … 6=Sun)
  const firstDow    = firstDay.getUTCDay(); // 0=Sun
  const startOffset = (firstDow + 6) % 7;

  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array(totalCells - daysInMonth - startOffset).fill(null),
  ];

  // Stats
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const monthStatuses = Object.entries(dayStatuses)
    .filter(([d]) => d.startsWith(monthPrefix))
    .map(([, s]) => s);

  const completedCount = monthStatuses.filter(s => s === "completed").length;
  const missedCount    = monthStatuses.filter(s => s === "missed").length;
  const scheduledDone  = monthStatuses.filter(s => s !== "rest" && s !== "future" && s !== "none").length;
  const pct = scheduledDone > 0 ? Math.round((completedCount / scheduledDone) * 100) : 0;

  const legend = isEN
    ? [
        { color: "#C9A84C",              label: "Completed" },
        { color: "rgba(239,68,68,0.55)", label: "Missed"    },
        { color: "rgba(63,63,70,0.5)",   label: "Rest"      },
      ]
    : [
        { color: "#C9A84C",              label: "Completo" },
        { color: "rgba(239,68,68,0.55)", label: "Falhado"  },
        { color: "rgba(63,63,70,0.5)",   label: "Descanso" },
      ];

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(160deg,#141414 0%,#0d0d0d 100%)" }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">
            {isEN ? "Training calendar" : "Calendário de treinos"}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-white">
            {MONTH_NAMES[month]}{" "}
            <span className="text-zinc-600 font-normal text-sm">{year}</span>
          </h3>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-right">
            <p className="text-xl font-black" style={{ color: "#C9A84C" }}>
              {completedCount}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{isEN ? "workouts" : "treinos"}</p>
          </div>
          {missedCount > 0 && (
            <div className="text-right">
              <p className="text-xl font-black text-red-400">{missedCount}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{isEN ? "missed" : "falhados"}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress bar ── */}
      {scheduledDone > 0 && (
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-600">
              {isEN
                ? `${completedCount} of ${scheduledDone} workouts completed`
                : `${completedCount} de ${scheduledDone} treinos concluídos`}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#C9A84C" }}>
              {pct}%
            </span>
          </div>
          <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? "linear-gradient(90deg,#22c55e,#16a34a)"
                  : "linear-gradient(90deg,#A8893A,#C9A84C)",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 px-3">
        {DOW_HEADERS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold text-zinc-700 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 px-3 pb-4 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status  = dayStatuses[dateStr] ?? "none";
          const isToday = dateStr === todayStr;

          const numColor =
            isToday                ? "text-black"          :
            status === "completed" ? "text-white"          :
            status === "missed"    ? "text-red-400/70"     :
            status === "rest"      ? "text-zinc-700"       :
            status === "future"    ? "text-zinc-600"       :
            "text-zinc-800";

          const dotBg =
            status === "completed" ? "#C9A84C"              :
            status === "missed"    ? "rgba(239,68,68,0.55)" :
            status === "rest"      ? "rgba(63,63,70,0.5)"   :
            "transparent";

          return (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5">
              <span
                className={`text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${numColor}`}
                style={isToday ? { background: "#C9A84C" } : undefined}
              >
                {day}
              </span>
              <div className="w-1 h-1 rounded-full" style={{ background: dotBg }} />
            </div>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="px-4 pb-4 flex items-center gap-4 flex-wrap">
        {legend.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] text-zinc-600 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
