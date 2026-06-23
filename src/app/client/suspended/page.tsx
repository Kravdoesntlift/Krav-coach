import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { getLang } from "@/lib/i18n/getLang";

export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, full_name")
    .eq("id", user!.id)
    .single();

  const lang = await getLang();

  // Cancelled is now handled by the client layout (Stripe paywall)
  // This page only handles paused / archived
  const isPaused = profile?.status === "paused";

  const extra = {
    paused_title:    { pt: "Conta temporariamente pausada", en: "Account temporarily paused" },
    suspended_title: { pt: "Conta suspensa", en: "Account suspended" },
    paused_sub:      { pt: "O acesso está suspenso temporariamente. Contacta o teu coach para reactivar.", en: "Access is temporarily suspended. Contact your coach to reactivate." },
    suspended_sub:   { pt: "O acesso à tua conta foi suspenso. Contacta o teu coach para mais informações.", en: "Access to your account has been suspended. Contact your coach for more information." },
    logout:          { pt: "Terminar sessão", en: "Log out" },
  } as const;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-white">
          KRAV<span className="text-brand-gold">.</span>
        </h1>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
          isPaused ? "border-yellow-500/30 bg-yellow-500/10" : "border-red-500/30 bg-red-500/10"
        }`}>
          <span className="text-4xl">{isPaused ? "⏸" : "🚫"}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">
            {isPaused ? extra.paused_title[lang] : extra.suspended_title[lang]}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isPaused ? extra.paused_sub[lang] : extra.suspended_sub[lang]}
          </p>
        </div>

        <div className="h-px bg-zinc-800" />
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
            {extra.logout[lang]}
          </button>
        </form>
      </div>
    </div>
  );
}
