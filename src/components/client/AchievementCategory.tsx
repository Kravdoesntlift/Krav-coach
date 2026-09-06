"use client";

import { useState } from "react";
import ShareAchievement from "@/components/client/ShareAchievement";
import type { Achievement } from "@/lib/achievements";

interface CategoryMeta {
  label: string;
  icon: string;
  description: string;
}

interface Props {
  cat: string;
  meta: CategoryMeta;
  items: Achievement[];
  clientName: string;
}

export default function AchievementCategory({ meta, items, clientName }: Props) {
  const [open, setOpen] = useState(false);

  const catUnlocked = items.filter((a) => a.unlocked).length;
  const catPct = Math.round((catUnlocked / items.length) * 100);
  const allUnlocked = catUnlocked === items.length;

  return (
    <section>
      {/* Category header: clickable */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              background: allUnlocked
                ? "linear-gradient(135deg,rgba(201,168,76,0.28),rgba(201,168,76,0.1))"
                : "rgba(39,39,42,0.8)",
              border: allUnlocked ? "1px solid rgba(201,168,76,0.55)" : "1px solid rgba(63,63,70,0.5)",
            }}
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="text-white font-bold text-sm">{meta.label}</h2>
              <span className="text-zinc-600 text-xs">{catUnlocked}/{items.length}</span>
            </div>
            <p className="text-zinc-600 text-xs mt-0.5">{meta.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allUnlocked && (
              <span className="text-xs font-bold text-brand-gold border border-brand-gold/30 px-2 py-0.5 rounded-full">
                Completo
              </span>
            )}
            <span
              className="text-zinc-600 text-xs transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="mb-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${catPct}%`,
              background: allUnlocked
                ? "linear-gradient(90deg,#A8893A,#C9A84C)"
                : "rgba(201,168,76,0.55)",
            }}
          />
        </div>
      </button>

      {/* Achievement grid: collapsible */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
          {items.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-3.5 transition-all ${
                a.unlocked ? "border border-brand-gold/25" : "border border-zinc-800/50"
              }`}
              style={{
                background: a.unlocked
                  ? "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(10,10,10,0.9))"
                  : "rgba(18,18,20,0.8)",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all ${
                    a.unlocked ? "" : "grayscale opacity-35"
                  }`}
                  style={{
                    background: a.unlocked ? "rgba(201,168,76,0.16)" : "rgba(39,39,42,0.8)",
                  }}
                >
                  {a.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm leading-tight ${a.unlocked ? "text-white" : "text-zinc-600"}`}>
                    {a.title}
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${a.unlocked ? "text-zinc-500" : "text-zinc-700"}`}>
                    {a.description}
                  </p>
                </div>

                {/* Status */}
                {a.unlocked ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ShareAchievement
                      title={a.title}
                      description={a.description}
                      icon={a.icon}
                      clientName={clientName}
                    />
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(201,168,76,0.22)", border: "1px solid rgba(201,168,76,0.4)" }}
                    >
                      <span className="text-brand-gold text-xs">✓</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-700 text-sm shrink-0">🔒</span>
                )}
              </div>

              {/* Progress bar (locked only, when started) */}
              {!a.unlocked && a.progress > 0 && (
                <div className="mt-2.5 space-y-1">
                  <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${a.progress}%`, background: "rgba(201,168,76,0.55)" }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 text-[10px]">{a.progressLabel}</span>
                    <span className="text-zinc-600 text-[10px]">{a.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
