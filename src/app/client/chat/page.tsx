import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import type { Message } from "@/lib/supabase/types";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

export default async function ClientChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const lang = await getLang();

  const extra = {
    messages_title: { pt: "Mensagens", en: "Messages" },
    chat_sub:       { pt: "Chat com o teu coach", en: "Chat with your coach" },
    no_coach_title: { pt: "Ainda sem coach atribuído", en: "No coach assigned yet" },
    no_coach_sub:   {
      pt: "O teu coach ainda não te adicionou à plataforma.\nFala com ele para que te envie o link de convite.",
      en: "Your coach hasn't added you to the platform yet.\nContact them to send you an invite link.",
    },
    client_fallback: { pt: "Cliente", en: "Client" },
  } as const;

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
        <h1 className="text-2xl font-bold text-white">{extra.messages_title[lang]}</h1>
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
            <p className="text-white font-bold text-base">{extra.no_coach_title[lang]}</p>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
              {extra.no_coach_sub[lang].split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
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
    .order("created_at", { ascending: false })
    .limit(50)
    .then(({ data, error }) => ({
      data: (data ?? []).reverse(),
      error,
    }));

  const { data: clientProfile } = await supabase
    .from("profiles").select("full_name").eq("id", user.id).single();

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">{extra.messages_title[lang]}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.chat_sub[lang]}</p>
      </div>
      <div className="card overflow-hidden">
        <ChatWindow
          currentUserId={user.id}
          currentUserName={clientProfile?.full_name ?? extra.client_fallback[lang]}
          otherUser={coach}
          initialMessages={(messages ?? []) as Message[]}
        />
      </div>
    </div>
  );
}
