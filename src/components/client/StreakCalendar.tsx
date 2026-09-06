"use client";

import { useLang } from "@/lib/i18n/useLang";

interface Props {
  completedDates: string[]; // "YYYY-MM-DD"
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
}

export default function StreakCalendar({ completedDates, currentStreak, longestStreak, totalWorkouts }: Props) {
  const { lang } = useLang();
  const locale = lang === "en" ? "en-GB" : "pt-PT";
  const dateSet = new Set(completedDates);

  // Build last 84 days (12 weeks)
  const today = new Date();
  const days: { date: string; label: string; dayOfWeek: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }), dayOfWeek: d.getDay() });
  }

  // Pad start so first week starts on Monday
  const firstDow = days[0].dayOfWeek === 0 ? 6 : days[0].dayOfWeek - 1; // Mon=0
  const paddedDays: (typeof days[0] | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...days,
  ];

  // Split into weeks
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const DAY_LABELS = lang === "en"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="card p-5 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-brand-gold text-2xl font-bold">{currentStreak}</p>
          <p className="text-gray-400 text-xs mt-0.5">{lang === "en" ? "Current streak" : "Sequência atual"}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-white text-2xl font-bold">{longestStreak}</p>
          <p className="text-gray-400 text-xs mt-0.5">{lang === "en" ? "Best streak" : "Melhor sequência"}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-3 text-center">
          <p className="text-white text-2xl font-bold">{totalWorkouts}</p>
          <p className="text-gray-400 text-xs mt-0.5">{lang === "en" ? "Total workouts" : "Total treinos"}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Day labels */}
          <div className="grid mb-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
          </div>
          <div className="flex gap-1">
            {/* Week day labels on left */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="h-[14px] text-[10px] text-gray-600 leading-none flex items-center">
                  {d}
                </div>
              ))}
            </div>
            {/* Weeks grid */}
            <div className="flex gap-1 flex-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 flex-1">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="h-[14px] w-full rounded-sm" />;
                    const done = dateSet.has(day.date);
                    const isToday = day.date === today.toISOString().slice(0, 10);
                    return (
                      <div
                        key={day.date}
                        title={`${day.label}${done ? " ✓" : ""}`}
                        className={`h-[14px] w-full rounded-sm transition-colors ${
                          done
                            ? "bg-brand-gold"
                            : isToday
                            ? "bg-zinc-600 ring-1 ring-brand-gold/50"
                            : "bg-zinc-800"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels */}
          <div className="flex mt-2 ml-8">
            {weeks.map((week, wi) => {
              const firstDay = week.find(Boolean);
              if (!firstDay) return <div key={wi} className="flex-1" />;
              const d = new Date(firstDay.date);
              const isFirstWeekOfMonth = d.getDate() <= 7;
              return (
                <div key={wi} className="flex-1 text-[9px] text-gray-600 truncate">
                  {isFirstWeekOfMonth ? d.toLocaleDateString(locale, { month: "short" }) : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentStreak >= 3 && (
        <p className="text-center text-brand-gold text-sm font-semibold">
          🔥 {lang === "en"
            ? `${currentStreak} days in a row, keep it up!`
            : `${currentStreak} dias seguidos, continua assim!`}
        </p>
      )}
    </div>
  );
}
