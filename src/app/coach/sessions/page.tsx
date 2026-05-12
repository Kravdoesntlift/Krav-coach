import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SessionsClient, {
  type SessionWithClient,
  type ClientOption,
} from "./SessionsClient";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch sessions joined with client profile
  const { data: rawSessions } = await supabase
    .from("coaching_sessions")
    .select(
      "*, client:profiles!coaching_sessions_client_id_fkey(id, full_name, avatar_url)"
    )
    .eq("coach_id", user.id)
    .order("scheduled_at", { ascending: true });

  // Fetch all clients assigned to this coach
  const { data: assignments } = await supabase
    .from("coach_clients")
    .select("client_id, profiles!coach_clients_client_id_fkey(id, full_name)")
    .eq("coach_id", user.id);

  const clientMap = new Map<string, ClientOption>();
  for (const row of assignments ?? []) {
    const p = row.profiles as unknown as { id: string; full_name: string } | null;
    if (p && !clientMap.has(p.id)) clientMap.set(p.id, { id: p.id, full_name: p.full_name });
  }
  const clients: ClientOption[] = Array.from(clientMap.values()).sort((a, b) =>
    a.full_name.localeCompare(b.full_name)
  );

  const sessions: SessionWithClient[] = (rawSessions ?? []).map((s) => {
    const client = s.client as unknown as {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
    return {
      id: s.id,
      client_id: s.client_id ?? null,
      client_name: client?.full_name ?? null,
      client_avatar_url: client?.avatar_url ?? null,
      scheduled_at: s.scheduled_at,
      duration_min: s.duration_min,
      session_type: s.session_type,
      location_or_link: s.location_or_link ?? null,
      notes: s.notes ?? null,
      status: s.status,
    };
  });

  return (
    <div className="space-y-6 page-enter">
      {/* Header + breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Link href="/coach/dashboard" className="hover:text-zinc-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Sessões</span>
        </nav>
        <h1 className="text-2xl font-bold text-white">Sessões de Coaching</h1>
        <p className="text-gray-400 text-sm mt-1">
          Agenda e gere as tuas sessões com clientes
        </p>
      </div>

      <SessionsClient sessions={sessions} clients={clients} coachId={user.id} />
    </div>
  );
}
