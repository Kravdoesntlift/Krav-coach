import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", user!.id)
    .single();

  const isPaused = profile?.status === "paused";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
        </div>

        {/* Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
          isPaused ? "border-yellow-500/30 bg-yellow-500/10" : "border-red-500/30 bg-red-500/10"
        }`}>
          <span className="text-4xl">{isPaused ? "⏸" : "✕"}</span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">
            {isPaused ? "Conta temporariamente pausada" : "Conta cancelada"}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isPaused
              ? "O acesso à tua conta está temporariamente suspenso. Contacta o teu coach para reactivar."
              : "O teu plano foi cancelado. Contacta o teu coach para mais informações."}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800" />

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Terminar sessão
          </button>
        </form>
      </div>
    </div>
  );
}
