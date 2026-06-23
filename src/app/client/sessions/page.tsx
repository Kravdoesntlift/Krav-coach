import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/getLang";

const extra = {
  title:       { pt: "As minhas sessões",                        en: "My sessions" },
  sub:         { pt: "Próximas sessões agendadas com o teu coach", en: "Upcoming sessions scheduled with your coach" },
  no_sessions: { pt: "O teu coach ainda não agendou sessões.",   en: "Your coach hasn't scheduled any sessions yet." },
  minutes:     { pt: "minutos",                                  en: "minutes" },
  in_person:   { pt: "Presencial",                              en: "In-person" },
  join_meeting:{ pt: "Join meeting",                            en: "Join meeting" },
} as const;

export default async function ClientSessionsPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const now = new Date().toISOString();
  const locale = lang === "en" ? "en-GB" : "pt-PT";

  const { data: sessions } = await supabase
    .from("coaching_sessions")
    .select("*")
    .eq("client_id", user.id)
    .eq("status", "confirmed")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{extra.title[lang]}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.sub[lang]}</p>
      </div>

      {/* Session list */}
      {!sessions || sessions.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <div className="text-5xl">📅</div>
          <p className="text-zinc-400 text-sm">{extra.no_sessions[lang]}</p>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {sessions.map((session) => {
            const isOnline = session.session_type === "online";
            return (
              <div key={session.id} className="card p-5 space-y-3">
                {/* Date + badges */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-white capitalize">
                      {formatDateTime(session.scheduled_at)}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {session.duration_min} {extra.minutes[lang]}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      isOnline
                        ? "text-blue-400 bg-blue-400/10"
                        : "text-brand-gold bg-brand-gold/10"
                    }`}
                  >
                    {isOnline ? "Online" : extra.in_person[lang]}
                  </span>
                </div>

                {/* Link / location */}
                {session.location_or_link && (
                  <div>
                    {isOnline ? (
                      <a
                        href={session.location_or_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-brand-gold hover:underline"
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                          <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5z" />
                          <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5z" />
                        </svg>
                        {extra.join_meeting[lang]}
                      </a>
                    ) : (
                      <p className="text-sm text-zinc-400">
                        📍 {session.location_or_link}
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {session.notes && (
                  <p className="text-sm text-zinc-500 italic border-t border-zinc-800 pt-3">
                    {session.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
