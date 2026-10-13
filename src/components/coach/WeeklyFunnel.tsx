import type { WeeklyFunnel as Data } from "@/lib/coach/weekly-funnel";

/**
 * Eight weeks, four numbers each. The point is the shape of the columns, not
 * the totals: a week that produced leads and no sales is a different problem
 * from a week that produced nothing at all.
 */
export default function WeeklyFunnel({ data }: { data: Data }) {
  const { rows, stripeRead } = data;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.leads, r.books ?? 0, r.trials, r.subscriptions)));

  const total = rows.reduce(
    (a, r) => ({
      leads: a.leads + r.leads,
      books: a.books + (r.books ?? 0),
      trials: a.trials + r.trials,
      subscriptions: a.subscriptions + r.subscriptions,
    }),
    { leads: 0, books: 0, trials: 0, subscriptions: 0 },
  );

  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" });

  const COLS: { key: keyof typeof total; label: string; color: string }[] = [
    { key: "leads", label: "Leads", color: "#C9A84C" },
    { key: "books", label: "Livros", color: "#facc15" },
    { key: "trials", label: "Trials", color: "#60a5fa" },
    { key: "subscriptions", label: "Subscrições", color: "#4ade80" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-base font-black text-white">Semana a semana</h2>
          <p className="text-zinc-500 text-xs mt-0.5">
            O que cada semana produziu · últimas {rows.length} semanas
          </p>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-zinc-600">
              <th className="text-left font-bold pb-2">Semana</th>
              {COLS.map((c) => (
                <th key={c.key} className="text-right font-bold pb-2 px-2" style={{ color: c.color }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const last = i === rows.length - 1;
              return (
                <tr key={r.weekStart} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className={`py-2 whitespace-nowrap ${last ? "text-white font-semibold" : "text-zinc-400"}`}>
                    {fmt(r.weekStart)}
                    {last && <span className="ml-2 text-[10px] text-zinc-600">esta semana</span>}
                  </td>
                  {COLS.map((c) => {
                    const value = c.key === "books" && r.books === null ? null : (r[c.key] as number);
                    return (
                      <td key={c.key} className="py-2 px-2 text-right tabular-nums">
                        <span className="inline-flex items-center gap-2 justify-end">
                          <span
                            className="hidden sm:block h-1.5 rounded-full"
                            style={{
                              width: `${Math.round(((value ?? 0) / max) * 40)}px`,
                              background: (value ?? 0) > 0 ? c.color : "transparent",
                              opacity: 0.55,
                            }}
                          />
                          <span className={(value ?? 0) > 0 ? "text-white" : "text-zinc-700"}>
                            {value === null ? "?" : value}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr style={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
              <td className="pt-2 text-[11px] uppercase tracking-wider text-zinc-600 font-bold">Total</td>
              {COLS.map((c) => (
                <td key={c.key} className="pt-2 px-2 text-right font-black text-white tabular-nums">
                  {c.key === "books" && !stripeRead ? "?" : total[c.key]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {!stripeRead && (
          <p className="text-[11px] text-zinc-600 mt-3">
            Não consegui ler as vendas do livro no Stripe, por isso essa coluna fica por saber em vez
            de aparecer a zero.
          </p>
        )}
      </div>
    </div>
  );
}
