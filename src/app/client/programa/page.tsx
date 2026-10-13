import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/getLang";
import {
  PROGRAM_90_WEEKS,
  is90DaysPlan,
  program90State,
  program90Structure,
  program90WeekFromName,
} from "@/lib/training/program90";
import Program90Card from "@/components/client/Program90Card";

/**
 * The thirteen weeks on one page: what is done, where they are, what is next.
 *
 * The card on the dashboard answers "what am I doing this week". This answers
 * "where am I going", which is the question a programme has to keep answering
 * or it stops feeling like one. A PDF does it with a contents page; this does
 * it with the weeks they have actually trained.
 */

export const metadata = {
  title: "Programa 90 Dias · KRAV",
  robots: { index: false, follow: false },
};

function mondayPlus(startMonday: string, weeks: number): string {
  const d = new Date(startMonday + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export default async function ProgramaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const lang = await getLang();
  const isEN = lang === "en";

  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, name, week_start, workout_days(id, is_rest, workout_completions(id))")
    .eq("client_id", user.id)
    .order("week_start", { ascending: true });

  const rows = (plans ?? []).map((p) => ({
    name: p.name as string | null,
    week_start: p.week_start as string,
    days: (p.workout_days ?? []) as { id: string; is_rest: boolean; workout_completions: { id: string }[] }[],
  }));

  const state = program90State(rows.map((r) => ({ name: r.name, week_start: r.week_start })));

  if (!state.enrolled) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 py-2 page-enter">
        <header className="space-y-1">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.7)" }}>
            {isEN ? "Programme" : "Programa"}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-white">90 Dias</h1>
        </header>
        <Program90Card lang={lang} state={state} />
      </div>
    );
  }

  const byWeekNumber = new Map<number, (typeof rows)[number]>();
  for (const r of rows) {
    if (!is90DaysPlan(r.name)) continue;
    const n = program90WeekFromName(r.name);
    if (n) byWeekNumber.set(n, r);
  }

  const current = state.currentWeek;
  let sessionsDone = 0;
  let sessionsPlanned = 0;

  const weeks = Array.from({ length: PROGRAM_90_WEEKS }, (_, i) => {
    const n = i + 1;
    const s = program90Structure(n);
    const plan = byWeekNumber.get(n);
    const training = (plan?.days ?? []).filter((d) => !d.is_rest);
    const done = training.filter((d) => (d.workout_completions ?? []).length > 0).length;
    if (plan && current !== null && n <= current) {
      sessionsDone += done;
      sessionsPlanned += training.length;
    }
    return {
      n,
      label: isEN ? s.label.en : s.label.pt,
      test: s.test,
      deload: s.deload,
      weekStart: state.startMonday ? mondayPlus(state.startMonday, i) : null,
      planned: training.length,
      done,
      status: current === null ? "future" : n < current ? "past" : n === current ? "current" : "future",
    };
  });

  const pct = Math.round(((current ?? 0) / PROGRAM_90_WEEKS) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2 page-enter">
      <header className="space-y-1">
        <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.7)" }}>
          {isEN ? "Programme" : "Programa"}
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">90 Dias</h1>
        <p className="text-sm text-zinc-400">
          {state.finished
            ? (isEN ? "Thirteen weeks done." : "Treze semanas feitas.")
            : isEN
            ? `Week ${current} of ${PROGRAM_90_WEEKS}. ${sessionsDone} of ${sessionsPlanned} sessions done so far.`
            : `Semana ${current} de ${PROGRAM_90_WEEKS}. ${sessionsDone} de ${sessionsPlanned} treinos feitos até agora.`}
        </p>
      </header>

      {!state.finished && (
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#E8C96B,#A8893A)" }} />
        </div>
      )}

      <ol className="space-y-2">
        {weeks.map((w) => {
          const isCurrent = w.status === "current";
          return (
            <li
              key={w.n}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={
                isCurrent
                  ? { background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)" }
                  : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              <span
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                style={
                  w.status === "past"
                    ? { background: "rgba(255,255,255,0.06)", color: "#71717a" }
                    : isCurrent
                    ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }
                    : { background: "rgba(255,255,255,0.03)", color: "#52525b", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {w.n}
              </span>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isCurrent ? "text-white" : "text-zinc-300"}`}>
                  {w.label}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-wider" style={{ color: "#C9A84C" }}>
                      {isEN ? "now" : "agora"}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-zinc-600">
                  {w.weekStart
                    ? new Date(w.weekStart + "T00:00:00Z").toLocaleDateString(isEN ? "en-GB" : "pt-PT", {
                        day: "numeric", month: "short", timeZone: "UTC",
                      })
                    : ""}
                  {w.planned > 0 && ` · ${w.done}/${w.planned} ${isEN ? "sessions" : "treinos"}`}
                </p>
              </div>

              {w.status === "past" && w.planned > 0 && (
                <span className="text-xs shrink-0" style={{ color: w.done >= w.planned ? "#4ade80" : "#52525b" }}>
                  {w.done >= w.planned ? "✓" : `${w.done}/${w.planned}`}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {state.finished && <Program90Card lang={lang} state={state} />}

      <div className="pt-1">
        <Link href="/client/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          ← {isEN ? "Back to today" : "Voltar ao treino de hoje"}
        </Link>
      </div>
    </div>
  );
}
