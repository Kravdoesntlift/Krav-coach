import type { Metadata } from "next";
import { guideCopy, guidePlan, type GuideVariant } from "@/lib/guide/content";
import type { Lang } from "@/lib/training/base-plan";

/**
 * The free guide, on screen and as the source the PDFs are printed from.
 *
 * One document, two versions and two languages, with the training week coming
 * from the same generator the app uses. Keeping the PDF as the only copy meant
 * the guide could say one thing and the app another, and nobody would notice
 * until a client did.
 */

export const metadata: Metadata = {
  // The guide is what a lead receives, not a page to rank. Leaving it open
  // would put the whole lead magnet one search away from the funnel.
  robots: { index: false, follow: false },
};

const DAY_NAMES: Record<Lang, string[]> = {
  pt: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

function normaliseVariant(value: string | undefined): GuideVariant {
  return value === "casa" || value === "home" ? "home" : "gym";
}

function normaliseLang(value: string | undefined): Lang {
  return value === "en" ? "en" : "pt";
}

const GOLD = "#C9A84C";

function Section({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <section
      className={`guide-page mx-auto w-full max-w-[720px] px-6 py-12 sm:px-10 ${last ? "" : "guide-break"}`}
    >
      <div className="guide-body">{children}</div>
      {/* Printed only: on screen this would be the same line five times. */}
      <p className="guide-footer hidden print:block">@kravdoesntlift · kravcoaching.com</p>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: "rgba(201,168,76,0.75)" }}>
      {children}
    </p>
  );
}

export default async function GuideReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; lang?: string }>;
}) {
  const { v, lang: langParam } = await searchParams;
  const variant = normaliseVariant(v);
  const lang = normaliseLang(langParam);
  const c = guideCopy(variant, lang);
  const plan = guidePlan(variant, lang);

  const trainingDays = plan.days
    .filter((d) => !d.is_rest)
    .sort((a, b) => a.order_index - b.order_index);
  const restDays = plan.days
    .filter((d) => d.is_rest)
    .map((d) => DAY_NAMES[lang][d.day_of_week]);

  return (
    <main className="min-h-screen" style={{ background: "#08080a", color: "#fff" }}>
      {/* ── 1. Cover ─────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>{c.kicker}</Eyebrow>
        <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: GOLD }}>
          {c.subtitle}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">{c.intro}</p>

        <div className="mt-10 space-y-3">
          {c.contents.map((item, i) => (
            <div key={item} className="flex items-start gap-4">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-zinc-300">{item}</span>
            </div>
          ))}
        </div>

        <div
          className="mt-10 rounded-2xl px-5 py-4"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}
        >
          <Eyebrow>{c.supplementLabel}</Eyebrow>
          <p className="mt-1 text-sm font-semibold text-white">{c.supplementValue}</p>
        </div>
      </Section>

      {/* ── 2. Principles ────────────────────────────────────────── */}
      <Section>
        <Eyebrow>{lang === "en" ? "Part 01" : "Parte 01"}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.principlesTitle}</h2>

        <div className="mt-8 space-y-6">
          {c.principles.map((p, i) => (
            <div key={p.title} className="guide-avoid-break flex gap-4">
              <span className="text-3xl font-black leading-none" style={{ color: "rgba(201,168,76,0.35)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 rounded-2xl px-5 py-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>
            {c.truth.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{c.truth.body}</p>
        </div>
      </Section>

      {/* ── 3. The plan ──────────────────────────────────────────── */}
      <Section>
        <Eyebrow>{lang === "en" ? "Part 02" : "Parte 02"}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.planTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.planIntro}</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {c.references.map((r) => (
            <div
              key={r.label}
              className="rounded-xl px-3 py-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-lg font-black" style={{ color: GOLD }}>{r.value}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-zinc-500">{r.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {trainingDays.map((day) => (
            <div
              key={day.day_of_week}
              className="guide-avoid-break rounded-2xl px-5 py-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-baseline justify-between gap-3 border-b pb-2"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-sm font-black uppercase tracking-wide text-white">
                  {DAY_NAMES[lang][day.day_of_week]}
                </h3>
                <span className="text-[11px] font-semibold" style={{ color: GOLD }}>{day.label}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {day.exercises.map((ex) => (
                  <li key={ex.name} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-zinc-300">{ex.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-500">
                      {ex.sets} x {ex.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          {lang === "en" ? "Rest: " : "Descanso: "}
          {restDays.join(", ")}. {c.planNote}
        </p>
      </Section>

      {/* ── 4. Nutrition and mistakes ────────────────────────────── */}
      <Section>
        <Eyebrow>{lang === "en" ? "Part 03" : "Parte 03"}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.nutritionTitle}</h2>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">{c.nutritionDisclaimer}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {c.nutrition.map((n) => (
            <div
              key={n.title}
              className="guide-avoid-break rounded-2xl px-4 py-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h3 className="text-sm font-bold text-white">{n.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{n.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-black tracking-tight">{c.mistakesTitle}</h2>
        <div className="mt-4 space-y-3">
          {c.mistakes.map((m) => (
            <div key={m.title} className="guide-avoid-break flex gap-3">
              <span className="text-sm font-black" style={{ color: "#f87171" }}>&times;</span>
              <div>
                <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. Free against paid, said plainly ───────────────────── */}
      <Section last>
        <Eyebrow>{lang === "en" ? "Part 04" : "Parte 04"}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.upgradeTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.upgradeIntro}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div
            className="guide-avoid-break rounded-2xl px-5 py-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3 className="text-sm font-black uppercase tracking-wide text-zinc-300">{c.upgradeFree.title}</h3>
            <ul className="mt-3 space-y-2">
              {c.upgradeFree.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-zinc-400">
                  <span className="text-zinc-600">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="guide-avoid-break rounded-2xl px-5 py-5"
            style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.28)" }}
          >
            <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>
              {c.upgradePaid.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {c.upgradePaid.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-zinc-300">
                  <span style={{ color: GOLD }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href={c.upgradeUrl}
          className="mt-8 inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-black text-black"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          {c.upgradeCta}
        </a>

        {/* On screen this closes the document. In print the page footer already
            signs every sheet, so it would be the same line twice. */}
        <p
          className="mt-10 border-t pt-4 text-[11px] text-zinc-600 print:hidden"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {c.footer}
        </p>
      </Section>
    </main>
  );
}
