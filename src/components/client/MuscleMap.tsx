"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Ellipse = { cx: number; cy: number; rx: number; ry: number };
type Overlay = { front: Ellipse[]; back: Ellipse[] };

// ─── Keyword → muscle detection ───────────────────────────────────────────────
const MUSCLE_KEYWORDS: Record<string, string[]> = {
  chest:      ["supino","peitoral","peito","chest","fly","flye","crucifixo","crossover","dip","mergulho","push","press","peck deck"],
  back:       ["remo","row","remada","pulldown","puxada","lat","costas","deadlift","terra","pull-up","pullup","chin-up","chinup","dominadas","back","trapézio","trapezio","hiperextensão","hiperextensao","t-bar","good morning"],
  shoulders:  ["ombro","shoulder","lateral raise","elevação lateral","frontal raise","desenvolvimento","military","arnold","face pull","deltóide","deltoide","upright row"],
  biceps:     ["bícep","bicep","curl","rosca","hammer","preacher","scott","zottman"],
  triceps:    ["trícep","tricep","extensão","extensao","kickback","skull","testa","francês","frances","pushdown","corda"],
  core:       ["abdominal","abdominais","crunch","plank","prancha","core","oblíq","russian twist","leg raise","elevação de pernas","abs","vacuum"],
  quads:      ["quadrícep","quadricep","squat","agachamento","leg press","extensão de perna","leg extension","lunges","afundo","hack squat","step-up","bulgaro","búlgaro"],
  hamstrings: ["isquio","leg curl","flexão de perna","romanian","romeno","stiff","hamstring","nordic"],
  glutes:     ["glúteo","gluteo","hip thrust","ponte","glute bridge","abdutor","addutor","hip abduction","donkey kick"],
  calves:     ["gémeo","gemeo","calf","panturrilha","gastrocnémio","solear","elevação plantar"],
};

export function getMusclesFromExercises(names: string[]): Set<string> {
  const active = new Set<string>();
  for (const name of names) {
    const lower = name.toLowerCase();
    for (const [muscle, kws] of Object.entries(MUSCLE_KEYWORDS))
      if (kws.some(kw => lower.includes(kw))) active.add(muscle);
  }
  return active;
}

// ─── Muscle overlay ellipses: viewBox "0 0 599 745" ─────────────────────────
//  Front figure: x=19-271, centre≈145   Back figure: x=333-600, centre≈460
const OVERLAYS: Record<string, Overlay> = {
  chest:      { front: [{ cx:152, cy:192, rx:54, ry:33 }], back: [] },
  back:       { front: [], back: [
    { cx:457, cy:147, rx:52, ry:26 },
    { cx:395, cy:213, rx:27, ry:44 },
    { cx:520, cy:213, rx:27, ry:44 },
    { cx:457, cy:268, rx:33, ry:23 },
  ]},
  shoulders:  { front: [{ cx:81,  cy:151, rx:23, ry:26 }, { cx:222, cy:151, rx:23, ry:26 }],
                back:  [{ cx:385, cy:148, rx:23, ry:26 }, { cx:527, cy:148, rx:23, ry:26 }] },
  biceps:     { front: [{ cx:71,  cy:218, rx:17, ry:44 }, { cx:231, cy:218, rx:17, ry:44 }], back: [] },
  triceps:    { front: [], back:  [{ cx:372, cy:218, rx:17, ry:44 }, { cx:540, cy:218, rx:17, ry:44 }] },
  core:       { front: [{ cx:152, cy:272, rx:27, ry:47 }], back: [] },
  glutes:     { front: [], back:  [{ cx:426, cy:346, rx:33, ry:35 }, { cx:491, cy:346, rx:33, ry:35 }] },
  quads:      { front: [{ cx:121, cy:428, rx:26, ry:50 }, { cx:178, cy:428, rx:26, ry:50 }], back: [] },
  hamstrings: { front: [], back:  [{ cx:413, cy:430, rx:27, ry:50 }, { cx:500, cy:430, rx:27, ry:50 }] },
  calves:     { front: [{ cx:118, cy:578, rx:18, ry:42 }, { cx:177, cy:578, rx:18, ry:42 }],
                back:  [{ cx:413, cy:578, rx:18, ry:42 }, { cx:500, cy:578, rx:18, ry:42 }] },
};

const MUSCLE_LABELS_PT: Record<string, string> = {
  chest:"Peito", back:"Costas", shoulders:"Ombros",
  biceps:"Bíceps", triceps:"Tríceps", core:"Core",
  quads:"Quadríceps", hamstrings:"Isquiotibiais", glutes:"Glúteos", calves:"Gémeos",
};
const MUSCLE_LABELS_EN: Record<string, string> = {
  chest:"Chest", back:"Back", shoulders:"Shoulders",
  biceps:"Biceps", triceps:"Triceps", core:"Core",
  quads:"Quads", hamstrings:"Hamstrings", glutes:"Glutes", calves:"Calves",
};

const IMG_FILTER = "invert(1) grayscale(0.85) brightness(0.78) contrast(1.18)";

interface Props {
  exerciseNames: string[];
  loggedNames?:  string[];
  lang?: "pt" | "en";
}

// ─── Shared SVG defs ──────────────────────────────────────────────────────────
function SvgDefs() {
  return (
    <defs>
      <filter id="mm-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feFlood floodColor="#C9A84C" floodOpacity="0.6" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="mm-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feFlood floodColor="#C9A84C" floodOpacity="0.3" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

// ─── Renders all overlay ellipses ─────────────────────────────────────────────
function MuscleEllipses({ scheduled, logged }: { scheduled: Set<string>; logged: Set<string> }) {
  return (
    <>
      {Object.entries(OVERLAYS).map(([muscle, overlay]) => {
        const isDone = logged.has(muscle);
        const isSched = scheduled.has(muscle);
        if (!isSched && !isDone) return null;
        const allE = [...overlay.front, ...overlay.back];
        return allE.map((e, i) => (
          <ellipse
            key={`${muscle}-${i}`}
            cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
            fill="#C9A84C"
            fillOpacity={isDone ? 0.72 : 0.38}
            filter={isDone ? "url(#mm-glow)" : "url(#mm-glow-soft)"}
          />
        ));
      })}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MuscleMap({ exerciseNames, loggedNames = [], lang = "pt" }: Props) {
  const [view, setView] = useState<"front" | "back">("front");
  const MUSCLE_LABELS = lang === "en" ? MUSCLE_LABELS_EN : MUSCLE_LABELS_PT;

  const scheduled = getMusclesFromExercises(exerciseNames);
  const logged    = getMusclesFromExercises(loggedNames);

  const totalMuscles = scheduled.size;
  const doneMuscles  = [...scheduled].filter(m => logged.has(m)).length;
  const pct          = totalMuscles > 0 ? Math.round((doneMuscles / totalMuscles) * 100) : 0;

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background:"linear-gradient(160deg,#1a1a1a 0%,#111111 100%)" }}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">{lang === "en" ? "Active muscles" : "Músculos ativos"}</p>
          <h3 className="mt-0.5 text-base font-bold text-white leading-tight">{lang === "en" ? "This week" : "Esta semana"}</h3>
        </div>
        {totalMuscles > 0 && (
          <div className="text-right">
            <span className="text-xl font-black" style={{ color:"#C9A84C" }}>{pct}%</span>
            <p className="text-[10px] text-zinc-500 mt-0.5">{doneMuscles}/{totalMuscles} {lang === "en" ? "groups" : "grupos"}</p>
          </div>
        )}
      </div>

      {/* ── Mobile: tab toggle ── */}
      <div className="flex md:hidden mx-3 mb-2 p-0.5 bg-zinc-900 rounded-xl">
        {(["front","back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 ${
              view === v ? "bg-brand-gold text-black shadow-sm" : "text-zinc-500"
            }`}
          >
            {v === "front" ? (lang === "en" ? "Front" : "Frente") : (lang === "en" ? "Back" : "Costas")}
          </button>
        ))}
      </div>

      {/* ── Mobile: single-figure slider ── */}
      {/*
        Slider is 200% wide inside an overflow:hidden container.
        paddingBottom:148% gives ~443 SVG units of height (covers quads/hamstrings).
        translateX(-50%) shifts to show the back figure (right half of anatomy.svg).
      */}
      <div className="block md:hidden mx-3 mb-2 rounded-2xl overflow-hidden" style={{ background:"#0a0a0a" }}>
        {/*
          Mobile figure layout, key insight:
          The anatomy SVG has viewBox "0 0 599 745" (aspect ratio 0.803:1).
          We display it at 200% of container width (= 2W), so img height = 2W × (745/599).
          The overlay SVG uses the SAME viewBox "0 0 599 745" → it scales identically to
          the img, so every ellipse aligns perfectly regardless of container crop.

          paddingBottom:124% clips the container at ~454px (at 366px card width),
          showing SVG y=0-371 → covers head, chest, shoulders, arms, core, glutes.
          Quads/calves are below the fold but shown in the chip labels.
          translateX(-50%) reveals the back half of the 200%-wide slider.
        */}
        <div style={{ position:"relative", paddingBottom:"245%", overflow:"hidden" }}>
          <div
            style={{
              position:"absolute",
              top:0, left:0,
              width:"200%",
              transform: view === "front" ? "translateX(0)" : "translateX(-50%)",
              transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/anatomy.svg"
              alt=""
              style={{ width:"100%", display:"block", filter:IMG_FILTER }}
            />
            {/* Same viewBox as anatomy.svg → perfect pixel alignment */}
            <svg
              viewBox="0 0 599 745"
              preserveAspectRatio="xMidYMin meet"
              style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <SvgDefs />
              <MuscleEllipses scheduled={scheduled} logged={logged} />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Desktop: side-by-side full figure ── */}
      <div className="hidden md:block mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background:"#0a0a0a" }}>
        <div className="absolute top-2 left-0 right-0 flex justify-around pointer-events-none" style={{position:"relative"}}>
          {/* Invisible spacer so labels stay relative to card */}
        </div>
        <div className="relative">
          <div className="absolute top-2 left-0 right-0 flex justify-around z-10 pointer-events-none">
            <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">{lang === "en" ? "Front" : "Frente"}</span>
            <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">{lang === "en" ? "Back" : "Costas"}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/anatomy.svg"
            alt={lang === "en" ? "Muscle anatomy" : "Anatomia muscular"}
            className="w-full block"
            style={{ filter:IMG_FILTER }}
          />
          <svg
            viewBox="0 0 599 745"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents:"none" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <SvgDefs />
            <MuscleEllipses scheduled={scheduled} logged={logged} />
          </svg>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {totalMuscles > 0 && (
        <div className="px-4 mb-3">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width:`${pct}%`, background:"linear-gradient(90deg,#A8893A,#C9A84C,#E2C060)" }}
            />
          </div>
        </div>
      )}

      {/* ── Muscle chips ── */}
      {(scheduled.size > 0 || logged.size > 0) && (
        <div className="px-3 pb-4 flex flex-wrap gap-1.5">
          {Object.keys(MUSCLE_LABELS)
            .filter(m => scheduled.has(m) || logged.has(m))
            .map(muscle => {
              const isDone = logged.has(muscle);
              return (
                <span
                  key={muscle}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: isDone ? "rgba(201,168,76,0.16)" : "rgba(201,168,76,0.05)",
                    color: isDone ? "#C9A84C" : "#7a6a32",
                    border:`1px solid ${isDone ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.16)"}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDone ? "#C9A84C" : "#5a4e26" }} />
                  {MUSCLE_LABELS[muscle]}
                </span>
              );
            })}
        </div>
      )}

      {scheduled.size === 0 && logged.size === 0 && (
        <div className="px-4 pb-5 text-center">
          <p className="text-zinc-600 text-sm">{lang === "en" ? "No muscle groups detected this week" : "Nenhum grupo muscular detectado esta semana"}</p>
        </div>
      )}
    </div>
  );
}
