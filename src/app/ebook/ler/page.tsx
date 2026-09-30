import type { Metadata } from "next";
import Link from "next/link";
import { ebookCopy, phasePlan, type EbookVariant, type PhaseNumber } from "@/lib/ebook/content";
import { readEbookToken } from "@/lib/ebook/access";
import ReaderToolbar from "@/components/ebook/ReaderToolbar";
import type { Lang } from "@/lib/training/base-plan";

/**
 * The paid book, on screen and as the source its PDF is printed from.
 *
 * Reached only with a signed link, which is what the buyer receives by email.
 * Without a valid token this says so plainly and points at the sales page,
 * rather than pretending the page does not exist: somebody whose link broke is
 * a customer, not an intruder.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const DAY_NAMES: Record<Lang, string[]> = {
  pt: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const GOLD = "#C9A84C";

function Section({ children, last = false, id }: { children: React.ReactNode; last?: boolean; id?: string }) {
  return (
    <section
      id={id}
      className={`guide-page mx-auto w-full max-w-[720px] px-6 py-12 sm:px-10 scroll-mt-16 ${last ? "" : "guide-break"}`}
    >
      <div className="guide-body">{children}</div>
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="guide-avoid-break rounded-2xl px-5 py-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {children}
    </div>
  );
}

function Blocks({ blocks }: { blocks: { title: string; body: string }[] }) {
  return (
    <div className="mt-6 space-y-5">
      {blocks.map((b) => (
        <div key={b.title} className="guide-avoid-break">
          <h3 className="text-base font-bold text-white">{b.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{b.body}</p>
        </div>
      ))}
    </div>
  );
}

function PhaseWeek({
  phase, variant, lang,
}: { phase: PhaseNumber; variant: EbookVariant; lang: Lang }) {
  const plan = phasePlan(phase, variant, lang);
  const days = plan.days.filter((d) => !d.is_rest).sort((a, b) => a.order_index - b.order_index);
  const rest = plan.days.filter((d) => d.is_rest).map((d) => DAY_NAMES[lang][d.day_of_week]);
  const c = ebookCopy(lang);

  return (
    <>
      <div className="mt-5 space-y-3">
        {days.map((day) => (
          <Card key={day.day_of_week}>
            <div className="flex items-baseline justify-between gap-3 border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <h4 className="text-sm font-black uppercase tracking-wide text-white">
                {DAY_NAMES[lang][day.day_of_week]}
              </h4>
              <span className="text-[11px] font-semibold" style={{ color: GOLD }}>{day.label}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {day.exercises.map((ex) => (
                <li key={ex.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-zinc-300">{ex.name}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500">{ex.sets} x {ex.reps}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500">{c.restLabel}: {rest.join(", ")}.</p>
    </>
  );
}

export default async function EbookReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; lang?: string; v?: string }>;
}) {
  const { t, lang: langParam, v } = await searchParams;
  const lang: Lang = langParam === "en" ? "en" : "pt";
  const variant: EbookVariant = v === "home" || v === "casa" ? "home" : "gym";
  const c = ebookCopy(lang);

  if (!readEbookToken(t)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#08080a", color: "#fff" }}>
        <div className="max-w-md text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: GOLD }}>KRAV</p>
          <h1 className="text-2xl font-black">
            {lang === "en" ? "This link is not valid" : "Este link não é válido"}
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            {lang === "en"
              ? "Open the book from the link in your purchase email. If you bought it and the link stopped working, write to me and I will send a new one."
              : "Abre o livro pelo link do email da compra. Se compraste e o link deixou de funcionar, escreve-me e envio outro."}
          </p>
          <Link
            href={lang === "en" ? "/ebook?lang=en" : "/ebook"}
            className="inline-block rounded-2xl px-6 py-3 text-sm font-bold text-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            {lang === "en" ? "See the book" : "Ver o livro"}
          </Link>
        </div>
      </main>
    );
  }

  const part = (n: number) => `${lang === "en" ? "Part" : "Parte"} ${String(n).padStart(2, "0")}`;

  return (
    <main className="min-h-screen" style={{ background: "#08080a", color: "#fff" }}>
      <ReaderToolbar token={t ?? ""} lang={lang} variant={variant} />

      {/* ── Cover ─────────────────────────────────────────────────── */}
      <Section id="c0">
        <Eyebrow>{c.kicker}</Eyebrow>
        <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">{c.title}</h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: GOLD }}>{c.subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}
          >
            {variant === "home" ? c.variantHome : c.variantGym}
          </span>
          <span className="text-xs text-zinc-500">{c.author}</span>
        </div>
        <p className="mt-3 text-xs text-zinc-600 print:hidden">{c.variantSwitchHint}</p>

        <div className="mt-10">
          <Eyebrow>{c.contentsTitle}</Eyebrow>
          <div className="mt-4 space-y-2.5">
            {c.contents.map((item, i) => (
              <a key={item} href={`#c${i + 1}`} className="flex items-start gap-4 group">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                  style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{item}</span>
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Who it is for ─────────────────────────────────────────── */}
      <Section id="c1">
        <Eyebrow>{part(1)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.forWhoTitle}</h2>
        <Blocks blocks={c.forWho} />
        <div className="mt-8 rounded-2xl px-5 py-5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}>
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>{c.honestyTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{c.honesty}</p>
        </div>
      </Section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <Section id="c2">
        <Eyebrow>{part(2)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.howTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.howIntro}</p>
        <Blocks blocks={c.how} />

        <div className="mt-8">
          <h3 className="text-base font-bold text-white">{c.rirTitle}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{c.rirIntro}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {c.rirRows.map((r) => (
              <div key={r.label} className="rounded-xl px-3 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-lg font-black" style={{ color: GOLD }}>{r.value}</p>
                <p className="mt-0.5 text-[10px] leading-tight text-zinc-500">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Warm up ───────────────────────────────────────────────── */}
      <Section id="c3">
        <Eyebrow>{part(3)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.warmupTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.warmupIntro}</p>
        <Blocks blocks={c.warmup} />
      </Section>

      {/* ── Technique ─────────────────────────────────────────────── */}
      <Section id="c4">
        <Eyebrow>{part(4)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.techniqueTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.techniqueIntro}</p>
        <div className="mt-6 space-y-4">
          {c.technique.map((m) => (
            <Card key={m.name}>
              <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: GOLD }}>{m.name}</h3>
              <ul className="mt-2.5 space-y-1.5">
                {m.cues.map((cue) => (
                  <li key={cue} className="flex items-start gap-2.5 text-sm leading-snug text-zinc-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "rgba(201,168,76,0.6)" }} />
                    {cue}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Log sheet ─────────────────────────────────────────────── */}
      <Section id="c5">
        <Eyebrow>{part(5)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.logTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.logIntro}</p>

        <div className="mt-6 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider"
            style={{ background: "rgba(201,168,76,0.1)", color: GOLD }}>
            {c.logHeaders.map((h, i) => (
              <span key={h} className={i === 0 ? "flex-1" : "w-[17%] shrink-0"}>{h}</span>
            ))}
          </div>
          {/* Empty rows to write on, with dividers rather than filled bars:
              a shaded box reads as a loading placeholder, not as a line. */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-2 px-4 py-[22px]"
              style={{ borderTop: "1px solid rgba(255,255,255,0.09)" }}>
              {c.logHeaders.map((h, j) => (
                <span
                  key={h}
                  className={`${j === 0 ? "flex-1" : "w-[17%] shrink-0"} block`}
                  style={j === 0 ? undefined : { borderLeft: "1px solid rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">{c.logNote}</p>
      </Section>

      {/* ── The three blocks ──────────────────────────────────────── */}
      {c.phases.map((p, i) => (
        <Section key={p.n} id={`c${6 + i}`}>
          <Eyebrow>{part(6 + i)}</Eyebrow>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            {p.name}
            <span className="ml-3 text-sm font-semibold text-zinc-500">{p.weeks}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.aim}</p>

          <div className="mt-6">
            <Eyebrow>{c.phaseRulesLabel}</Eyebrow>
            <ul className="mt-3 space-y-2">
              {p.rules.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7">
            <Eyebrow>{c.phasePlanLabel}</Eyebrow>
            <PhaseWeek phase={p.n} variant={variant} lang={lang} />
          </div>

          <p className="mt-5 text-xs leading-relaxed text-zinc-500">
            <span className="font-bold text-zinc-400">{c.phaseDeloadLabel}: </span>{p.deload}
          </p>
        </Section>
      ))}

      {/* ── Test week ─────────────────────────────────────────────── */}
      <Section id="c9">
        <Eyebrow>{part(9)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.testTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.testIntro}</p>
        <Blocks blocks={c.test} />
      </Section>

      {/* ── Training at home ──────────────────────────────────────── */}
      <Section id="c10">
        <Eyebrow>{part(10)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.homeTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {variant === "home" ? c.variantHomeNote : c.homeIntro}
        </p>
        <div className="mt-6 space-y-2">
          {c.homeSwaps.map((s) => (
            <div key={s.from} className="guide-avoid-break flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="w-[42%] shrink-0 text-zinc-500">{s.from}</span>
              <span style={{ color: GOLD }}>→</span>
              <span className="flex-1 text-zinc-300">{s.to}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Nutrition ─────────────────────────────────────────────── */}
      <Section id="c11">
        <Eyebrow>{part(11)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.nutritionTitle}</h2>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">{c.nutritionDisclaimer}</p>
        <Blocks blocks={c.nutrition} />

        <div className="mt-8">
          <Eyebrow>{c.mealsTitle}</Eyebrow>
          <div className="mt-3 space-y-2">
            {c.meals.map((m) => (
              <div key={m.when} className="guide-avoid-break flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="w-[32%] shrink-0 font-semibold text-white">{m.when}</span>
                <span className="flex-1 text-zinc-400">{m.what}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Recovery ──────────────────────────────────────────────── */}
      <Section id="c12">
        <Eyebrow>{part(12)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.recoveryTitle}</h2>
        <Blocks blocks={c.recovery} />
      </Section>

      {/* ── Measuring ─────────────────────────────────────────────── */}
      <Section id="c13">
        <Eyebrow>{part(13)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.measureTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.measureIntro}</p>
        <Blocks blocks={c.measure} />
      </Section>

      {/* ── Mistakes and FAQ ──────────────────────────────────────── */}
      <Section id="c14">
        <Eyebrow>{part(14)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.mistakesTitle}</h2>
        <Blocks blocks={c.mistakes} />
      </Section>

      <Section id="c15">
        <Eyebrow>{part(15)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.faqTitle}</h2>
        <div className="mt-6 space-y-4">
          {c.faq.map((f) => (
            <div key={f.q} className="guide-avoid-break">
              <h3 className="text-sm font-bold text-white">{f.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Day 91 ────────────────────────────────────────────────── */}
      <Section id="c16" last>
        <Eyebrow>{part(16)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{c.endTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{c.endIntro}</p>
        <Blocks blocks={c.end} />

        <a
          href={c.endUrl}
          className="mt-8 block rounded-2xl px-6 py-4 text-center text-sm font-bold text-black print:hidden"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          {c.endCta}
        </a>
        <p className="mt-8 text-center text-xs text-zinc-600">{c.footer}</p>
      </Section>
    </main>
  );
}
