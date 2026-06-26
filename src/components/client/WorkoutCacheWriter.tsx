"use client";

import { useEffect } from "react";

interface CachedDay {
  label: string;
  exercises: string[];
  isRest: boolean;
}

interface Props {
  todayLabel: string | null;
  todayExercises: string[];
  todayIsRest: boolean;
  weekDays: CachedDay[];
}

// Writes the current workout plan to localStorage so the /offline page can
// display it when there is no internet connection.
export default function WorkoutCacheWriter({ todayLabel, todayExercises, todayIsRest, weekDays }: Props) {
  useEffect(() => {
    try {
      localStorage.setItem("krav_today_workout", JSON.stringify({
        label: todayLabel,
        exercises: todayExercises,
        isRest: todayIsRest,
        weekDays,
        cachedAt: new Date().toISOString(),
      }));
    } catch {}
  }, [todayLabel, todayExercises, todayIsRest, weekDays]);

  return null;
}
