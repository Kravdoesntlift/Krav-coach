"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/lib/i18n/useLang";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HabitDefinition {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

interface HabitLog {
  id: string;
  habit_id: string;
  logged_date: string;
}

interface WeekDay {
  date: string; // YYYY-MM-DD
  label: string; // "Mo", "Tu", etc.
}

interface Props {
  clientId: string;
  initialHabits: HabitDefinition[];
  initialLogs: HabitLog[];      // today's logs for toggle state
  allWeekLogs: HabitLog[];      // last 7 days logs for mini calendar
  today: string; // YYYY-MM-DD
  weekDays: WeekDay[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ["💧", "🏃", "🧘", "😴", "🥗", "📚", "🚭", "🧠"];

const POPULAR_SUGGESTIONS = [
  { emoji: "💧", name_pt: "Beber 2L de água", name_en: "Drink 2L of water" },
  { emoji: "🏃", name_pt: "30 min de exercício", name_en: "30 min exercise" },
  { emoji: "😴", name_pt: "Dormir 8 horas", name_en: "Sleep 8 hours" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function HabitTracker({
  clientId: _clientId,
  initialHabits,
  initialLogs,
  allWeekLogs,
  today,
  weekDays,
}: Props) {
  const { t, lang } = useLang();

  const [habits, setHabits] = useState<HabitDefinition[]>(initialHabits);
  // logs = today-only state for toggle; weekLogs = full 7-day state for calendar
  const [logs, setLogs] = useState<HabitLog[]>(initialLogs);
  const [weekLogs, setWeekLogs] = useState<HabitLog[]>(allWeekLogs);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState(EMOJI_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  // Delete confirm state: habit_id or null
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Is the habit checked for TODAY (uses optimistic state)
  const isTodayChecked = useCallback(
    (habitId: string) =>
      logs.some((l) => l.habit_id === habitId && l.logged_date === today),
    [logs, today]
  );

  // Is the habit checked on any given date (uses weekLogs for past days)
  const isCheckedOn = useCallback(
    (habitId: string, date: string) => {
      if (date === today) return isTodayChecked(habitId);
      return weekLogs.some((l) => l.habit_id === habitId && l.logged_date === date);
    },
    [weekLogs, isTodayChecked, today]
  );

  const computeStreak = useCallback(
    (habitId: string): number => {
      // Walk backwards from today
      let streak = 0;
      const sorted = [...weekDays].sort((a, b) => b.date.localeCompare(a.date));
      for (const day of sorted) {
        if (day.date > today) continue;
        if (isCheckedOn(habitId, day.date)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },
    [isCheckedOn, weekDays, today]
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleToggle(habitId: string) {
    const key = `toggle-${habitId}`;
    if (loading[key]) return;
    setLoading((p) => ({ ...p, [key]: true }));

    // Optimistic update — today logs only
    const wasChecked = isTodayChecked(habitId);
    const existing = logs.find(
      (l) => l.habit_id === habitId && l.logged_date === today
    );
    if (wasChecked && existing) {
      setLogs((p) => p.filter((l) => l.id !== existing.id));
      setWeekLogs((p) => p.filter((l) => l.id !== existing.id));
    } else {
      const tempId = `temp-${Date.now()}`;
      const tempLog = { id: tempId, habit_id: habitId, logged_date: today };
      setLogs((p) => [...p, tempLog]);
      setWeekLogs((p) => [...p, tempLog]);
    }

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          habit_id: habitId,
          logged_date: today,
        }),
      });
      if (!res.ok) {
        // Revert on error
        if (wasChecked && existing) {
          setLogs((p) => [...p, existing]);
          setWeekLogs((p) => [...p, existing]);
        } else {
          setLogs((p) =>
            p.filter(
              (l) => !(l.habit_id === habitId && l.logged_date === today)
            )
          );
          setWeekLogs((p) =>
            p.filter(
              (l) => !(l.habit_id === habitId && l.logged_date === today)
            )
          );
        }
      } else {
        // If checked, replace temp id with server-assigned id (fetch fresh)
        const data = await res.json() as { checked: boolean };
        if (data.checked) {
          const fresh = await fetch("/api/habits");
          if (fresh.ok) {
            const freshData = await fresh.json() as {
              habits: HabitDefinition[];
              logs: HabitLog[];
            };
            // Update today logs with real ids
            setLogs(freshData.logs);
            // Merge into weekLogs: replace any temp today entries
            setWeekLogs((prev) => [
              ...prev.filter((l) => l.logged_date !== today),
              ...freshData.logs,
            ]);
          }
        }
      }
    } catch {
      // Revert
      setLogs(initialLogs);
      setWeekLogs(allWeekLogs);
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleCreate(name: string, emoji: string) {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name, emoji }),
      });
      if (res.ok) {
        const { habit } = await res.json() as { habit: HabitDefinition };
        setHabits((p) => [...p, habit]);
        setShowAddForm(false);
        setNewName("");
        setNewEmoji(EMOJI_OPTIONS[0]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(habitId: string) {
    setLoading((p) => ({ ...p, [`del-${habitId}`]: true }));
    setConfirmDelete(null);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", habit_id: habitId }),
      });
      if (res.ok) {
        setHabits((p) => p.filter((h) => h.id !== habitId));
        setLogs((p) => p.filter((l) => l.habit_id !== habitId));
        setWeekLogs((p) => p.filter((l) => l.habit_id !== habitId));
      }
    } finally {
      setLoading((p) => ({ ...p, [`del-${habitId}`]: false }));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t("habit_today")}</h2>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setNewName("");
            setNewEmoji(EMOJI_OPTIONS[0]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-dark transition-colors"
        >
          <span className="text-base leading-none">+</span>
          {t("add_habit")}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card p-4 space-y-3 border border-brand-gold/30">
          {/* Emoji picker */}
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map((em) => (
              <button
                key={em}
                onClick={() => setNewEmoji(em)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  newEmoji === em
                    ? "bg-brand-gold/20 ring-1 ring-brand-gold scale-110"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          {/* Name input */}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate(newName, newEmoji);
              if (e.key === "Escape") setShowAddForm(false);
            }}
            placeholder={t("habit_name")}
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-gold"
          />
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleCreate(newName, newEmoji)}
              disabled={saving || !newName.trim()}
              className="flex-1 py-2 rounded-xl bg-brand-gold text-black text-sm font-semibold disabled:opacity-40 hover:bg-brand-gold-dark transition-colors"
            >
              {saving ? "..." : t("save")}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !showAddForm && (
        <div className="card p-6 text-center space-y-4">
          <p className="text-zinc-500 text-sm">{t("no_habits")}</p>
          <p className="text-zinc-600 text-xs">{t("no_habits_sub")}</p>
          {/* Popular suggestions */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
              {t("habit_popular")}
            </p>
            {POPULAR_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleCreate(lang === "en" ? s.name_en : s.name_pt, s.emoji)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm text-zinc-300">
                  {lang === "en" ? s.name_en : s.name_pt}
                </span>
                <span className="ml-auto text-brand-gold text-sm">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Habit list */}
      {habits.map((habit) => {
        const checked = isTodayChecked(habit.id);
        const toggling = loading[`toggle-${habit.id}`];
        const deleting = loading[`del-${habit.id}`];
        const confirming = confirmDelete === habit.id;
        const streak = computeStreak(habit.id);

        return (
          <div
            key={habit.id}
            className={`card p-4 transition-all ${
              checked ? "border-brand-gold/40" : "border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(habit.id)}
                disabled={toggling}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  checked
                    ? "bg-brand-gold border-brand-gold text-black"
                    : "border-zinc-600 hover:border-brand-gold"
                } ${toggling ? "opacity-50" : ""}`}
              >
                {checked && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7l3.5 3.5L12 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              {/* Emoji + Name */}
              <span className="text-xl">{habit.emoji}</span>
              <span
                className={`flex-1 text-sm font-medium transition-colors ${
                  checked ? "text-zinc-400 line-through" : "text-white"
                }`}
              >
                {habit.name}
              </span>

              {/* Streak badge */}
              {streak > 0 && (
                <span className="text-xs text-brand-gold font-semibold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                  🔥 {streak}
                </span>
              )}

              {/* Delete button / confirm */}
              {confirming ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleDelete(habit.id)}
                    disabled={deleting}
                    className="text-xs px-2 py-1 rounded-lg bg-red-900/60 text-red-400 hover:bg-red-900 transition-colors"
                  >
                    {t("confirm")}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(habit.id)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  aria-label="Delete habit"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* 7-day mini calendar */}
            <div className="mt-3 flex gap-1.5 justify-end">
              {weekDays.map((day) => {
                const done = isCheckedOn(habit.id, day.date);
                const isToday = day.date === today;
                return (
                  <div key={day.date} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-zinc-600 uppercase">
                      {day.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full transition-colors ${
                        done
                          ? "bg-brand-gold"
                          : isToday
                          ? "bg-zinc-700 ring-1 ring-brand-gold/40"
                          : "bg-zinc-800"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
