import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

function MiniLineChart({
  data, color = "#C9A84C", label, unit = "",
}: {
  data: { x: string; y: number }[];
  color?: string;
  label: string;
  unit?: string;
}) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">Dados insuficientes</div>
  );
  const values = data.map((d) => d.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 300, H = 80, PAD = 8;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + ((max - d.y) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });
  const last = data[data.length - 1];
  return (
    <div>
      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-white mb-3">{last.y}{unit}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={[...pts, `${W - PAD},${H}`, `${PAD},${H}`].join(" ")}
          fill={`url(#g-${label})`}
          stroke="none"
        />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const [x, y] = pts[i].split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
        <span>{data[0].x}</span>
        <span>{last.x}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(18,18,20,0.8)", border: `1px solid ${highlight ? "rgba(201,168,76,0.3)" : "rgba(39,39,42,0.5)"}` }}>
      <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${highlight ? "text-brand-gold" : "text-white"}`}>{value}</p>
      {sub && <p className="text-zinc-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function fmtWeek(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // Last 12 weeks
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
  const since = twelveWeeksAgo.toISOString().split("T")[0];

  const [
    { data: clients },
    { data: checkins },
    { data: completions },
    { data: subscriptions },
    { data: allPlans },
  ] = await Promise.all([
    supabase.from("coach_clients").select("client_id, profiles!coach_clients_client_id_fkey(status, created_at)").eq("coach_id", user.id).eq("assigned_role", "coach"),
    supabase.from("weekly_checkins").select("client_id, week_start").gte("week_start", since).order("week_start"),
    supabase.from("workout_completions").select("client_id, created_at").gte("created_at", since + "T00:00:00"),
    supabase.from("stripe_subscriptions").select("status, amount_cents, current_period_end").eq("coach_id", user.id),
    supabase.from("workout_plans").select("client_id, week_start").eq("coach_id", user.id).gte("week_start", since),
  ]);

  type ProfileRef = { status: string | null; created_at: string } | null;
  const activeClients = (clients ?? []).filter((c) => (c.profiles as unknown as ProfileRef)?.status === "active");
  const totalActive = activeClients.length;
  const totalRevenue = (subscriptions ?? []).filter((s) => s.status === "active").reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);

  // Build weekly check-in rate (last 8 weeks)
  const weekKeys: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7 - d.getDay() + 1);
    weekKeys.push(d.toISOString().split("T")[0]);
  }

  const checkinsByWeek = new Map<string, Set<string>>();
  for (const c of checkins ?? []) {
    const wk = weekKeys.find((w) => {
      const wDate = new Date(w);
      const cDate = new Date(c.week_start);
      const diff = (cDate.getTime() - wDate.getTime()) / 86400000;
      return diff >= 0 && diff < 7;
    }) ?? c.week_start;
    if (!checkinsByWeek.has(wk)) checkinsByWeek.set(wk, new Set());
    checkinsByWeek.get(wk)!.add(c.client_id);
  }

  const checkinRateData = weekKeys.map((w) => ({
    x: fmtWeek(w),
    y: totalActive > 0 ? Math.round(((checkinsByWeek.get(w)?.size ?? 0) / totalActive) * 100) : 0,
  }));

  // Weekly completion count
  const completionsByWeek = new Map<string, number>();
  for (const c of completions ?? []) {
    const date = c.created_at.slice(0, 10);
    const wk = weekKeys.find((w) => {
      const diff = (new Date(date).getTime() - new Date(w).getTime()) / 86400000;
      return diff >= 0 && diff < 7;
    }) ?? date;
    completionsByWeek.set(wk, (completionsByWeek.get(wk) ?? 0) + 1);
  }
  const completionData = weekKeys.map((w) => ({
    x: fmtWeek(w),
    y: completionsByWeek.get(w) ?? 0,
  }));

  // New clients per week
  const newClientsByWeek = new Map<string, number>();
  for (const c of activeClients) {
    const created = (c.profiles as unknown as ProfileRef)?.created_at?.slice(0, 10) ?? "";
    const wk = weekKeys.find((w) => {
      const diff = (new Date(created).getTime() - new Date(w).getTime()) / 86400000;
      return diff >= 0 && diff < 7;
    });
    if (wk) newClientsByWeek.set(wk, (newClientsByWeek.get(wk) ?? 0) + 1);
  }
  const newClientsData = weekKeys.map((w) => ({
    x: fmtWeek(w),
    y: newClientsByWeek.get(w) ?? 0,
  }));

  // Revenue per month (last 6 months)
  const avgCheckinRate = checkinRateData.length > 0
    ? Math.round(checkinRateData.reduce((s, d) => s + d.y, 0) / checkinRateData.length)
    : 0;

  const monthlyRevenue = (totalRevenue / 100).toFixed(2).replace(".", ",");
  const yearlyProjection = ((totalRevenue * 12) / 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div className="space-y-8 page-enter">
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Últimas 8 semanas · dados em tempo real</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Clientes ativos" value={String(totalActive)} highlight />
        <StatCard label="Receita mensal" value={`€${monthlyRevenue}`} sub="subscriptions ativas" />
        <StatCard label="Taxa check-in" value={`${avgCheckinRate}%`} sub="média 8 sem." />
        <StatCard label="Projeção anual" value={`€${yearlyProjection}`} sub="baseado na receita atual" />
      </div>

      {/* Charts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}>
          <MiniLineChart data={checkinRateData} label="Taxa de Check-in" unit="%" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}>
          <MiniLineChart data={completionData} color="#60a5fa" label="Treinos Completos" unit=" treinos" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}>
          <MiniLineChart data={newClientsData} color="#4ade80" label="Novos Clientes" unit=" clientes" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}>
          {/* Subscription status breakdown */}
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">Estado das Subscrições</p>
          {(subscriptions ?? []).length === 0 ? (
            <p className="text-zinc-600 text-sm">Sem subscrições ainda.</p>
          ) : (
            <div className="space-y-2">
              {(["active", "past_due", "cancelled", "trialing"] as const).map((status) => {
                const count = (subscriptions ?? []).filter((s) => s.status === status).length;
                if (count === 0) return null;
                const colors: Record<string, string> = { active: "#4ade80", past_due: "#f87171", cancelled: "#71717a", trialing: "#60a5fa" };
                const labels: Record<string, string> = { active: "Ativa", past_due: "Em falta", cancelled: "Cancelada", trialing: "Trial" };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors[status] }} />
                      <span className="text-sm text-zinc-400">{labels[status]}</span>
                    </div>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
