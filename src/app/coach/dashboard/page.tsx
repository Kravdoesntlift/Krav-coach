import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BroadcastForm from "@/components/coach/BroadcastForm";
import SmartAlerts from "@/components/coach/SmartAlerts";
import NotifyButton from "@/components/coach/NotifyButton";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import CoachClientList, { type ClientData } from "@/components/coach/CoachClientList";

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Current week
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  // Plans this week + completions
  const { data: weekPlans } = await supabase
    .from("workout_plans")
    .select(`
      client_id,
      client:profiles!workout_plans_client_id_fkey(id, full_name, status, subscription_renews_at, avatar_url),
      workout_days(id, workout_completions(client_id))
    `)
    .eq("coach_id", user!.id)
    .eq("week_start", weekStart);

  const clientIds = [...new Set((weekPlans ?? []).map((p) => p.client_id))];

  // Check-ins this week (inclui sono e stress do checkin v2)
  const { data: weekCheckins } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("week_start", weekStart)
    .in("client_id", clientIds.length > 0 ? clientIds : ["none"]);

  // PRs desta semana
  const { data: weekPRs } = await supabase
    .from("personal_records")
    .select("client_id, exercise_name")
    .gte("recorded_at", weekStart)
    .in("client_id", clientIds.length > 0 ? clientIds : ["none"]);

  const prsByClient = new Map<string, string[]>();
  for (const pr of weekPRs ?? []) {
    const list = prsByClient.get(pr.client_id) ?? [];
    list.push(pr.exercise_name);
    prsByClient.set(pr.client_id, list);
  }

  // All clients (with status) — from workout plans
  const { data: allPlans } = await supabase
    .from("workout_plans")
    .select("client_id, client:profiles!workout_plans_client_id_fkey(id, full_name, status, subscription_renews_at, avatar_url)")
    .eq("coach_id", user!.id);

  // Also clients explicitly assigned via coach_clients (may not have plans yet)
  const { data: assignedRows } = await supabase
    .from("coach_clients")
    .select("client_id, profiles!coach_clients_client_id_fkey(id, full_name, status, subscription_renews_at, avatar_url)")
    .eq("coach_id", user!.id)
    .eq("assigned_role", "coach");

  // Unread messages per sender (client)
  const { data: unreadMsgs } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", user!.id)
    .is("read_at", null);

  const unreadByClient = new Map<string, number>();
  for (const m of unreadMsgs ?? []) {
    unreadByClient.set(m.sender_id, (unreadByClient.get(m.sender_id) ?? 0) + 1);
  }

  // All client IDs — from plans AND explicit assignments
  const allClientIds = [
    ...new Set([
      ...(allPlans ?? []).map((p) => p.client_id),
      ...(assignedRows ?? []).map((r) => r.client_id),
    ]),
  ];

  // Last check-in date per client (for attention alerts)
  const { data: recentCheckins } = await supabase
    .from("weekly_checkins")
    .select("client_id, week_start")
    .in("client_id", allClientIds.length > 0 ? allClientIds : ["none"])
    .order("week_start", { ascending: false });

  const lastCheckinByClient = new Map<string, string>();
  for (const c of recentCheckins ?? []) {
    if (!lastCheckinByClient.has(c.client_id)) lastCheckinByClient.set(c.client_id, c.week_start);
  }

  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(todayMidnight);
  twoWeeksAgo.setDate(todayMidnight.getDate() - 14);

  // Build clientMap for this week
  type ClientEntry = {
    id: string; full_name: string; status: string; avatar_url?: string | null;
    totalDays: number; completedDays: number;
    checkin: { energy_level: number | null; sleep_quality: number | null; stress_level: number | null } | null;
  };
  const clientMap = new Map<string, ClientEntry>();

  for (const plan of weekPlans ?? []) {
    const client = plan.client as unknown as { id: string; full_name: string; status: string; avatar_url?: string | null } | null;
    if (!client) continue;
    const days = plan.workout_days ?? [];
    const completedDays = days.filter((d: { workout_completions?: { client_id: string }[] }) =>
      d.workout_completions?.some((c) => c.client_id === client.id)
    ).length;
    const checkin = weekCheckins?.find((c) => c.client_id === client.id) ?? null;
    if (!clientMap.has(client.id)) {
      clientMap.set(client.id, {
        id: client.id,
        full_name: client.full_name,
        status: client.status ?? "active",
        avatar_url: client.avatar_url,
        totalDays: days.length,
        completedDays,
        checkin,
      });
    }
  }

  // All clients deduplicated — union of plan clients + explicitly assigned clients
  type AllClientEntry = { id: string; full_name: string; status: string; subscription_renews_at: string | null; avatar_url?: string | null };
  const allClientMap = new Map<string, AllClientEntry>();
  for (const p of allPlans ?? []) {
    const c = p.client as unknown as AllClientEntry | null;
    if (c && !allClientMap.has(c.id)) allClientMap.set(c.id, c);
  }
  // Merge explicitly assigned clients (may not have plans)
  for (const r of assignedRows ?? []) {
    const c = r.profiles as unknown as AllClientEntry | null;
    if (c && !allClientMap.has(c.id)) allClientMap.set(c.id, c);
  }

  const allClients = Array.from(allClientMap.values());
  const weekClients = Array.from(clientMap.values());

  // Smart alerts
  type AlertType = "no_checkin" | "renewal" | "overdue_renewal" | "no_completion" | "perfect_week" | "pr_week" | "at_risk";
  const alerts: { type: AlertType; clientId: string; clientName: string; detail: string; urgency: "high" | "medium" | "low" }[] = [];

  for (const client of allClients) {
    const name = client.full_name;
    const id = client.id;

    // Overdue renewal
    const renewsAt = client.subscription_renews_at;
    if (renewsAt) {
      const diff = Math.ceil((new Date(renewsAt + "T00:00:00").getTime() - todayMidnight.getTime()) / 86400000);
      if (diff < 0) {
        alerts.push({ type: "overdue_renewal", clientId: id, clientName: name, detail: `Renovação em atraso (${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? "s" : ""})`, urgency: "high" });
      } else if (diff <= 3) {
        alerts.push({ type: "renewal", clientId: id, clientName: name, detail: `Renovação em ${diff} dia${diff !== 1 ? "s" : ""}`, urgency: "high" });
      } else if (diff <= 7) {
        alerts.push({ type: "renewal", clientId: id, clientName: name, detail: `Renovação em ${diff} dias`, urgency: "medium" });
      }
    }

    // No check-in in 14+ days
    const lastCheckinStr = lastCheckinByClient.get(id);
    if (!lastCheckinStr || new Date(lastCheckinStr + "T00:00:00") < twoWeeksAgo) {
      const detail = lastCheckinStr
        ? `Último check-in há ${Math.floor((Date.now() - new Date(lastCheckinStr + "T00:00:00").getTime()) / 86400000)} dias`
        : "Nunca fez check-in";
      alerts.push({ type: "no_checkin", clientId: id, clientName: name, detail, urgency: "medium" });
    }

    // No workout completed this week (but has a plan)
    const weekClient = clientMap.get(id);
    if (weekClient && weekClient.completedDays === 0 && weekClient.totalDays > 0) {
      alerts.push({ type: "no_completion", clientId: id, clientName: name, detail: "Sem treinos concluídos esta semana", urgency: "low" });
    }

    // Perfect week
    if (weekClient && weekClient.totalDays > 0 && weekClient.completedDays >= weekClient.totalDays) {
      alerts.push({ type: "perfect_week", clientId: id, clientName: name, detail: "Semana perfeita — envia parabéns!", urgency: "low" });
    }

    // PR esta semana
    const prs = prsByClient.get(id);
    if (prs && prs.length > 0) {
      alerts.push({
        type: "pr_week", clientId: id, clientName: name, urgency: "low",
        detail: prs.length === 1 ? `Novo PR em ${prs[0]}` : `${prs.length} novos PRs esta semana`,
      });
    }

    // Em risco de abandono: energia baixa + < 50% treinos + sem check-in
    if (weekClient) {
      const lowEnergy  = (weekClient.checkin?.energy_level ?? 3) <= 2;
      const lowPct     = weekClient.totalDays > 0 && (weekClient.completedDays / weekClient.totalDays) < 0.5;
      const noCheckin  = !weekCheckins?.find((c) => c.client_id === id);
      if (lowEnergy && lowPct && noCheckin) {
        alerts.push({ type: "at_risk", clientId: id, clientName: name, detail: "Energia baixa, poucos treinos e sem check-in", urgency: "high" });
      }
    }
  }

  // Stats
  const totalCompletions = weekClients.reduce((s, c) => s + c.completedDays, 0);
  const totalPossible = weekClients.reduce((s, c) => s + c.totalDays, 0);
  const avgCompletion = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
  const checkinCount = weekCheckins?.length ?? 0;
  const avgEnergy = weekCheckins && weekCheckins.filter((c) => c.energy_level).length > 0
    ? (weekCheckins.reduce((s, c) => s + (c.energy_level ?? 0), 0) / weekCheckins.filter((c) => c.energy_level).length).toFixed(1)
    : null;
  const totalUnread = unreadMsgs?.length ?? 0;

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              {today.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <PushNotificationToggle />
            <NotifyButton label="Notificar todos" />
            <BroadcastForm />
            <Link href="/coach/manage-clients" className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-medium transition-colors">
              👥 Gerir Clientes
            </Link>
            <Link href="/coach/plans/new" className="btn-primary text-sm">+ Novo Plano</Link>
          </div>
        </div>

        {/* Mobile actions — scrollable row */}
        <div className="flex sm:hidden items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <PushNotificationToggle />
          <NotifyButton label="Notificar" />
          <BroadcastForm />
          <Link href="/coach/manage-clients" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 text-gray-300 text-sm font-medium whitespace-nowrap shrink-0">
            👥 Gerir
          </Link>
          <Link href="/coach/plans/new" className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 text-black" style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}>
            + Plano
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Clientes ativos" value={String(allClients.filter((c) => (c.status ?? "active") === "active").length)} sub={`de ${allClients.length} total`} />
        <StatCard label="Treinos esta semana" value={`${avgCompletion}%`} sub="taxa de conclusão" highlight={avgCompletion >= 70} />
        <StatCard label="Check-ins" value={`${checkinCount}/${weekClients.length}`} sub="esta semana" />
        <StatCard label="Mensagens novas" value={String(totalUnread)} highlight={totalUnread > 0} sub={totalUnread > 0 ? "por responder" : "em dia"} />
      </div>

      {/* Smart alerts */}
      <SmartAlerts alerts={alerts} />

      {/* Unified client list with search */}
      {allClients.length === 0 ? (
        <section>
          <div className="card p-12 text-center">
            <p className="text-gray-500 mb-4">Ainda não tens clientes com planos atribuídos.</p>
            <Link href="/coach/plans/new" className="btn-primary text-sm">Criar primeiro plano</Link>
          </div>
        </section>
      ) : (
        <CoachClientList
          coachId={user!.id}
          clients={allClients
            .sort((a, b) => {
              const ua = unreadByClient.get(a.id) ?? 0;
              const ub = unreadByClient.get(b.id) ?? 0;
              if (ub !== ua) return ub - ua;
              return a.full_name.localeCompare(b.full_name);
            })
            .map((client): ClientData => {
              const weekClient = clientMap.get(client.id);
              const unread = unreadByClient.get(client.id) ?? 0;
              const lastCheckinStr = lastCheckinByClient.get(client.id);
              const needsAttention = !lastCheckinStr || new Date(lastCheckinStr + "T00:00:00") < twoWeeksAgo;
              const renewsAt = client.subscription_renews_at;
              const renewsSoon = !!(renewsAt && new Date(renewsAt + "T00:00:00") <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
              return {
                id: client.id,
                full_name: client.full_name,
                status: client.status ?? "active",
                avatar_url: client.avatar_url,
                subscription_renews_at: client.subscription_renews_at,
                totalDays: weekClient?.totalDays,
                completedDays: weekClient?.completedDays,
                checkin: weekClient?.checkin,
                unread,
                needsAttention,
                renewsSoon,
              };
            })}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 stat-enter ${highlight ? "card-gold" : "card"}`}>
      <p className="text-[10px] font-semibold text-zinc-500 tracking-[0.12em] uppercase mb-2">{label}</p>
      <p className={`text-2xl font-black tracking-tight leading-none ${highlight ? "text-brand-gold" : "text-white"}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-zinc-600 mt-1.5 font-medium">{sub}</p>
      )}
    </div>
  );
}
