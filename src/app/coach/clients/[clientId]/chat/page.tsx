import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ChatWindow from "@/components/ChatWindow";
import type { Message } from "@/lib/supabase/types";

export default async function CoachClientChatPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: client }, { data: coachProfile }, { data: messages }, { data: lastCheckin }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, status").eq("id", clientId).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => ({ data: (data ?? []).reverse(), error })),
    supabase.from("weekly_checkins").select("week_start, weight_kg, energy_level")
      .eq("client_id", clientId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!client) notFound();

  const statusColor: Record<string, string> = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    cancelled: "bg-red-500",
    paused: "bg-zinc-500",
  };

  return (
    <div className="space-y-4 page-enter max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/coach/messages" className="hover:text-white transition-colors">← Mensagens</Link>
      </div>

      {/* Client header */}
      <div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: "rgba(18,18,20,0.8)", border: "1px solid rgba(39,39,42,0.5)" }}
      >
        {/* Avatar */}
        {client.avatar_url ? (
          <Image src={client.avatar_url} alt={client.full_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-black text-base shrink-0"
            style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}>
            {(client.full_name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-base leading-tight truncate">{client.full_name}</p>
            {client.status && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor[client.status] ?? "bg-zinc-600"}`} title={client.status} />
            )}
          </div>
          {lastCheckin ? (
            <p className="text-zinc-500 text-xs mt-0.5">
              Último check-in: {new Date(lastCheckin.week_start + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
              {lastCheckin.weight_kg ? ` · ${lastCheckin.weight_kg} kg` : ""}
              {lastCheckin.energy_level ? ` · energia ${lastCheckin.energy_level}/5` : ""}
            </p>
          ) : (
            <p className="text-zinc-600 text-xs mt-0.5">Sem check-ins ainda</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/coach/clients/${clientId}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-brand-gold transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Perfil
          </Link>
          <Link
            href={`/coach/clients/${clientId}#checkins`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-brand-gold transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Check-ins
          </Link>
        </div>
      </div>

      {/* Chat */}
      <div className="card overflow-hidden">
        <ChatWindow
          currentUserId={user!.id}
          currentUserName={coachProfile?.full_name ?? "Coach"}
          otherUser={client}
          initialMessages={(messages ?? []) as Message[]}
        />
      </div>
    </div>
  );
}
