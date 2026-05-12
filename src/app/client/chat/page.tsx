import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import AppBadge from "@/components/client/AppBadge";
import type { Message } from "@/lib/supabase/types";

export default async function ClientChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Look up coach via explicit assignment (preferred)
  const { data: assignment } = await supabase
    .from("coach_clients")
    .select("coach_id, profiles!coach_clients_coach_id_fkey(id, full_name, avatar_url)")
    .eq("client_id", user.id)
    .eq("assigned_role", "coach")
    .maybeSingle();

  let coach: { id: string; full_name: string; avatar_url?: string | null } | null =
    (assignment?.profiles as unknown as { id: string; full_name: string; avatar_url?: string | null } | null) ?? null;

  // 2. Fallback: find via most recent workout plan
  if (!coach) {
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("coach_id, profiles!workout_plans_coach_id_fkey(id, full_name, avatar_url)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    coach = (plan?.profiles as unknown as { id: string; full_name: string; avatar_url?: string | null } | null) ?? null;
  }

  if (!coach) {
    return (
      <div className="space-y-6 page-enter">
        <h1 className="text-2xl font-bold text-white">Mensagens</h1>
        <div
          className="rounded-3xl p-12 text-center space-y-5"
          style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <span className="text-4xl">💬</span>
          </div>
          <div>
            <p className="text-white font-bold text-base">Ainda sem coach atribuído</p>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
              O teu coach ainda não te adicionou à plataforma.<br />
              Fala com ele para que te envie o link de convite.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${coach.id}),and(sender_id.eq.${coach.id},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  const { data: clientProfile } = await supabase
    .from("profiles").select("full_name").eq("id", user.id).single();

  return (
    <div className="space-y-4 page-enter">
      {/* Limpa o badge ao abrir o chat */}
      <AppBadge userId={user.id} />
      <div>
        <h1 className="text-2xl font-bold text-white">Mensagens</h1>
        <p className="text-gray-400 text-sm mt-1">Chat com o teu coach</p>
      </div>
      <div className="card overflow-hidden">
        <ChatWindow
          currentUserId={user.id}
          currentUserName={clientProfile?.full_name ?? "Cliente"}
          otherUser={coach}
          initialMessages={(messages ?? []) as Message[]}
        />
      </div>
    </div>
  );
}
