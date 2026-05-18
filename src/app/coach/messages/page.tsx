import { createClient } from "@/lib/supabase/server";
import MessagesClient, { type Convo } from "./MessagesClient";

export default async function CoachMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── All clients assigned to this coach (with status to filter archived) ──────
  const { data: assignments } = await supabase
    .from("coach_clients")
    .select("client_id, profiles!coach_clients_client_id_fkey(id, full_name, avatar_url, status)")
    .eq("coach_id", user!.id)
    .eq("assigned_role", "coach");

  // Legacy: clients only found via workout plans
  const { data: planClients } = await supabase
    .from("workout_plans")
    .select("client_id, profiles!workout_plans_client_id_fkey(id, full_name, avatar_url, status)")
    .eq("coach_id", user!.id);

  // De-duped map — skip archived
  type ClientProfile = { id: string; full_name: string; avatar_url: string | null; status: string | null };
  const clientMap = new Map<string, ClientProfile>();

  for (const row of assignments ?? []) {
    const p = row.profiles as unknown as ClientProfile | null;
    // Only show active clients (not unpaid/pending/archived)
    if (p && p.status === "active" && !clientMap.has(p.id)) clientMap.set(p.id, p);
  }
  for (const row of planClients ?? []) {
    const p = row.profiles as unknown as ClientProfile | null;
    if (p && p.status === "active" && !clientMap.has(p.id)) clientMap.set(p.id, p);
  }

  const allClientIds = [...clientMap.keys()];

  // ── Messages ─────────────────────────────────────────────────────────────────
  const { data: allMessages } = allClientIds.length > 0
    ? await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
    : { data: [] };

  // ── Build conversation list ───────────────────────────────────────────────────
  const convos: Convo[] = allClientIds.map((clientId) => {
    const profile = clientMap.get(clientId)!;
    const thread  = (allMessages ?? []).filter(
      (m) => m.sender_id === clientId || m.receiver_id === clientId
    );
    const last   = thread[0];
    const unread = thread.filter(
      (m) => m.receiver_id === user!.id && m.sender_id === clientId && !m.read_at
    ).length;

    return {
      clientId,
      clientName:  profile.full_name ?? "Cliente",
      avatarUrl:   profile.avatar_url ?? null,
      lastMessage: last?.content ?? "",
      lastAt:      last?.created_at ?? "",
      unread,
      hasMessages: thread.length > 0,
    };
  });

  // Sort: unread first → most recent message → alphabetical
  convos.sort((a, b) => {
    if (b.unread !== a.unread) return b.unread - a.unread;
    if (a.hasMessages !== b.hasMessages) return a.hasMessages ? -1 : 1;
    if (a.lastAt && b.lastAt) return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    return a.clientName.localeCompare(b.clientName);
  });

  return <MessagesClient convos={convos} />;
}
