"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";

interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  action?: string;
}

interface Props {
  clientId: string;
  hasCompletedOnboarding: boolean;
  hasLoggedCheckin: boolean;
  hasLoggedNutrition: boolean;
  hasCompletedWorkout: boolean;
  hasProfilePhoto: boolean;
}

export default function SetupChecklist({
  clientId,
  hasCompletedOnboarding,
  hasLoggedCheckin,
  hasLoggedNutrition,
  hasCompletedWorkout,
  hasProfilePhoto,
}: Props) {
  const { lang } = useLang();

  const extra = {
    first_steps:      { pt: "Primeiros passos",                    en: "Getting started" },
    completed_of:     { pt: "de",                                  en: "of" },
    completed_suffix: { pt: "concluídos",                          en: "completed" },
    hide_guide:       { pt: "Ocultar este guia",                   en: "Hide this guide" },
    onboarding:       { pt: "Preencher o questionário inicial",    en: "Complete the initial questionnaire" },
    first_checkin:    { pt: "Fazer o primeiro check-in semanal",   en: "Do your first weekly check-in" },
    first_workout:    { pt: "Concluir o primeiro treino",          en: "Complete your first workout" },
    first_meal:       { pt: "Registar a primeira refeição",        en: "Log your first meal" },
    profile_photo:    { pt: "Adicionar foto de perfil",            en: "Add a profile photo" },
    close:            { pt: "Fechar",                              en: "Close" },
  } as const;

  const LS_KEY = `krav_setup_dismissed_${clientId}`;
  const [dismissed, setDismissed] = useState(true); // start hidden to prevent flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const isDismissed = localStorage.getItem(LS_KEY) === "1";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, [LS_KEY]);

  const items: CheckItem[] = [
    {
      id: "onboarding",
      label: extra.onboarding[lang],
      done: hasCompletedOnboarding,
      href: undefined, // OnboardingModal is triggered from dashboard
    },
    {
      id: "checkin",
      label: extra.first_checkin[lang],
      done: hasLoggedCheckin,
      href: "/client/checkin",
    },
    {
      id: "workout",
      label: extra.first_workout[lang],
      done: hasCompletedWorkout,
      href: "/client/dashboard",
    },
    {
      id: "nutrition",
      label: extra.first_meal[lang],
      done: hasLoggedNutrition,
      href: "/client/nutrition",
    },
    {
      id: "photo",
      label: extra.profile_photo[lang],
      done: hasProfilePhoto,
      href: "/client/profile",
    },
  ];

  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  function dismiss() {
    try { localStorage.setItem(LS_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  }

  // Auto-dismiss once everything is complete
  useEffect(() => {
    if (allDone && mounted) dismiss();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, mounted]);

  if (!mounted || dismissed || allDone) return null;

  return (
    <div
      className="card p-4 space-y-3 border"
      style={{ borderColor: "rgba(201,168,76,0.22)", background: "rgba(201,168,76,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <div>
            <p className="text-white text-sm font-bold">{extra.first_steps[lang]}</p>
            <p className="text-zinc-500 text-[11px]">{done} {extra.completed_of[lang]} {total} {extra.completed_suffix[lang]}</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs p-1"
          aria-label={extra.close[lang]}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #E8C96B, #C9A84C)",
          }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const content = (
            <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
              !item.done && item.href ? "hover:bg-white/[0.04] cursor-pointer" : ""
            }`}>
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.done
                    ? "bg-green-500/20 border border-green-500/40"
                    : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                {item.done && (
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {/* Label */}
              <span className={`text-sm ${item.done ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                {item.label}
              </span>
              {/* Arrow for pending items */}
              {!item.done && item.href && (
                <svg className="w-3.5 h-3.5 text-zinc-600 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );

          return item.href && !item.done ? (
            <Link key={item.id} href={item.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>

      {/* Dismiss link */}
      <button
        onClick={dismiss}
        className="w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors pt-1"
      >
        {extra.hide_guide[lang]}
      </button>
    </div>
  );
}
