import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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

  const [{ data: client }, { data: coachProfile }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", clientId).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => ({ data: (data ?? []).reverse(), error })),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-4 page-enter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/coach/messages" className="text-zinc-500 hover:text-white transition-colors">
          Mensagens
        </Link>
        <span className="text-zinc-700">/</span>
        <Link href={`/coach/clients/${clientId}`} className="text-zinc-500 hover:text-white transition-colors">
          {client.full_name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
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
