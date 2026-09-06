import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import SubscriptionManager from "@/components/client/SubscriptionManager";
import LanguageSelector from "@/components/client/LanguageSelector";
import TwoFactorSettings from "@/components/client/TwoFactorSettings";
import { logout } from "@/app/auth/actions";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";
import type { ReactNode } from "react";
import { BotIcon, CalendarIcon, UsersIcon } from "@/components/ui/Icons";

function WatchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7" />
      <polyline points="12 9 12 12 13.5 13.5" />
      <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83" />
    </svg>
  );
}

const extra = {
  profile_title:   { pt: "Perfil",              en: "Profile" },
  profile_sub:     { pt: "Conta & definições",  en: "Account & settings" },
  logout_title:    { pt: "Terminar sessão",      en: "Log out" },
  ai_coach_sub:    { pt: "Assistente inteligente", en: "Smart assistant" },
  sessions_label:  { pt: "Sessões",             en: "Sessions" },
  sessions_sub:    { pt: "Próximas sessões",     en: "Upcoming sessions" },
  integrations_label: { pt: "Integrações",      en: "Integrations" },
  referral_label:  { pt: "Referências",          en: "Referrals" },
  referral_sub:    { pt: "Convida amigos",        en: "Invite friends" },
  subscription:    { pt: "Subscrição",           en: "Subscription" },
  status_label:    { pt: "Estado",               en: "Status" },
  trial_active:    { pt: "Trial",                en: "Trial" },
  days_left:       { pt: "dias restantes",       en: "days remaining" },
  day_left:        { pt: "dia restante",         en: "day remaining" },
  trial_expired:   { pt: "Trial expirado",       en: "Trial expired" },
  ends_on:         { pt: "Termina em",           en: "Ends on" },
  ended_on:        { pt: "Terminou em",          en: "Ended on" },
  trial_warn:      { pt: "Subscreve antes que o trial termine para não perder acesso.", en: "Subscribe before the trial ends to keep access." },
} as const;

export default async function ClientProfilePage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: subscription } = await supabase
    .from("stripe_subscriptions")
    .select("status, amount_cents, current_period_end")
    .eq("client_id", user!.id)
    .in("status", ["active", "past_due", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tools: { href: string; icon: React.ReactNode; label: string; sub: string }[] = [
    { href: "/client/ai-coach",     icon: <BotIcon size={20} />,      label: "AI Coach",                    sub: extra.ai_coach_sub[lang] },
    { href: "/client/sessions",     icon: <CalendarIcon size={20} />, label: extra.sessions_label[lang],    sub: extra.sessions_sub[lang] },
    { href: "/client/integrations", icon: <WatchIcon />,              label: extra.integrations_label[lang], sub: "Apple Health · Strava" },
    { href: "/client/referral",     icon: <UsersIcon size={20} />,    label: extra.referral_label[lang],    sub: extra.referral_sub[lang] },
  ];

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{extra.profile_title[lang]}</h1>
          <p className="text-gray-400 text-sm mt-1">{extra.profile_sub[lang]}</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationToggle />
          {/* Logout icon: always visible at the top */}
          <form action={logout}>
            <button
              type="submit"
              title={extra.logout_title[lang]}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-2 gap-2">
        {tools.map(({ href, icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <span className="w-8 flex-shrink-0 flex items-center justify-center text-zinc-400">{icon}</span>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">{label}</p>
              <p className="text-zinc-500 text-[11px] leading-tight mt-0.5 truncate">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <ProfileForm profile={profile} email={user!.email ?? ""} />

      {/* Language selector */}
      <LanguageSelector />

      {/* Trial info: only shown when on trial and no paid subscription yet */}
      {profile?.trial_ends_at && !subscription && (() => {
        const msLeft = new Date(profile.trial_ends_at!).getTime() - Date.now();
        const daysLeft = Math.ceil(msLeft / 86_400_000);
        const trialEnd = new Date(profile.trial_ends_at!).toLocaleDateString(
          lang === "en" ? "en-GB" : "pt-PT",
          { day: "numeric", month: "long" }
        );
        return (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(18,18,22,0.8)", border: "1px solid rgba(201,168,76,0.22)" }}>
            <h2 className="text-white font-bold text-base">{extra.subscription[lang]}</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{extra.status_label[lang]}</span>
                <span className={`font-semibold ${daysLeft > 0 ? "text-[#C9A84C]" : "text-red-400"}`}>
                  {daysLeft > 0
                    ? `${extra.trial_active[lang]} · ${daysLeft} ${daysLeft !== 1 ? extra.days_left[lang] : extra.day_left[lang]}`
                    : extra.trial_expired[lang]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{daysLeft > 0 ? extra.ends_on[lang] : extra.ended_on[lang]}</span>
                <span className="text-zinc-300">{trialEnd}</span>
              </div>
            </div>
            {daysLeft > 0 && (
              <p className="text-zinc-600 text-xs text-center">{extra.trial_warn[lang]}</p>
            )}
          </div>
        );
      })()}

      <SubscriptionManager
        hasSubscription={!!subscription && !!profile?.stripe_customer_id}
        status={subscription?.status ?? null}
        renewsAt={subscription?.current_period_end ?? null}
        amountCents={subscription?.amount_cents ?? null}
      />

      {/* Security */}
      <div className="space-y-3">
        <h2 className="text-white font-bold text-base">
          {lang === "pt" ? "Segurança" : "Security"}
        </h2>
        <TwoFactorSettings />
      </div>

      {/* Logout: also at bottom for discoverability */}
      <form action={logout}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-zinc-800 hover:border-red-500/20 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t("logout", lang)}
        </button>
      </form>
    </div>
  );
}
