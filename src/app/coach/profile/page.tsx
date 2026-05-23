import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import PushDebugPanel from "@/components/PushDebugPanel";
import PublicLinkCard from "@/components/coach/PublicLinkCard";
import TransformationUpload from "@/components/coach/TransformationUpload";
import { logout } from "@/app/auth/actions";

const tools = [
  { href: "/coach/sessions",       emoji: "📅", label: "Sessões",        sub: "Agendar & gerir" },
  { href: "/coach/challenges",     emoji: "🏆", label: "Desafio Mensal", sub: "Leaderboard" },
  { href: "/coach/manage-clients", emoji: "⚙️", label: "Gerir Clientes", sub: "Ativar · Pausar" },
  { href: "/coach/library",        emoji: "📚", label: "Biblioteca",     sub: "Exercícios" },
  { href: "/coach/setup",          emoji: "🚀", label: "Configuração",   sub: "Onboarding" },
  { href: "/coach/billing",        emoji: "💳", label: "Faturação",      sub: "Subscrição" },
];

export default async function CoachProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="page-enter space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 text-sm mt-1">Conta & ferramentas</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          {/* Logout icon — always visible at the top */}
          <form action={logout}>
            <button
              type="submit"
              title="Terminar sessão"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Tools hub grid */}
      <div className="grid grid-cols-3 gap-2">
        {tools.map(({ href, emoji, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors text-center"
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-white text-[11px] font-semibold leading-tight">{label}</span>
            <span className="text-zinc-600 text-[10px] leading-tight">{sub}</span>
          </Link>
        ))}
      </div>

      {/* Public link */}
      <PublicLinkCard coachId={user!.id} />

      {/* Profile form */}
      <ProfileForm profile={profile} email={user!.email ?? ""} />

      {/* Transformation photos */}
      {profile?.role === "coach" && (
        <div className="card p-5">
          <TransformationUpload
            currentBeforeUrl={profile.transformation_before_url ?? null}
            currentAfterUrl={profile.transformation_after_url ?? null}
          />
        </div>
      )}

      <PushDebugPanel />

      {/* Logout */}
      <form action={logout}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-zinc-800 hover:border-red-500/20 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Terminar sessão
        </button>
      </form>
    </div>
  );
}
