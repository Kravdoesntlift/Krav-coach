"use client";
import { useLang } from "@/lib/i18n/useLang";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import type { NavItem } from "@/components/Navbar";
import { DumbbellIcon, ChatIcon, ChartIcon, UserIcon, ForkKnifeIcon } from "@/components/ui/Icons";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/supabase/types";

interface ClientShellProps {
  children: ReactNode;
  profile: Profile;
  unread: number;
  trialDaysLeft: number | null;
  subscribeAction: () => Promise<void>;
  userId: string;
}

export function ClientShell({
  children,
  profile,
  unread,
  trialDaysLeft,
  subscribeAction,
  userId,
}: ClientShellProps) {
  const { t } = useLang();

  const clientNav: NavItem[] = [
    { href: "/client/dashboard", label: t("nav_workout") },
    { href: "/client/nutrition", label: t("nav_nutrition") },
    { href: "/client/chat",      label: t("nav_chat"), badge: unread },
    {
      label: t("nav_progress"),
      children: [
        { href: "/client/progress",      label: t("nav_analysis") },
        { href: "/client/checkin",       label: t("nav_checkin") },
        { href: "/client/daily-log",     label: t("nav_daily_log") },
        { href: "/client/history",       label: t("nav_history") },
        { href: "/client/records",       label: t("nav_prs") },
        { href: "/client/achievements",  label: t("nav_achievements") },
        { href: "/client/photos",        label: t("nav_photos") },
        { href: "/client/report",        label: t("nav_report_m") },
        { href: "/client/weekly-report", label: t("nav_report_w") },
        { href: "/client/leaderboard",   label: t("nav_leaderboard") },
      ],
    },
    {
      label: t("nav_profile"),
      children: [
        { href: "/client/profile",       label: t("nav_my_account") },
        { href: "/client/meal-plan",     label: t("nav_meal_plan") },
        { href: "/client/ai-coach",      label: t("nav_ai_coach") },
        { href: "/client/sessions",      label: t("nav_sessions") },
        { href: "/client/integrations",  label: t("nav_integrations") },
        { href: "/client/referral",      label: t("nav_referral") },
        { href: "/client/testimonial",   label: t("nav_testimonial") },
      ],
    },
  ];

  const clientBottomNav = [
    { href: "/client/dashboard", label: t("nav_workout"),   icon: <DumbbellIcon size={22} />,  badge: 0 },
    { href: "/client/nutrition", label: t("nav_nutrition"), icon: <ForkKnifeIcon size={22} />, badge: 0 },
    { href: "/client/chat",      label: t("nav_chat"),      icon: <ChatIcon size={22} />,      badge: unread },
    { href: "/client/progress",  label: t("nav_progress"),  icon: <ChartIcon size={22} />,     badge: 0 },
    { href: "/client/profile",   label: t("nav_profile"),   icon: <UserIcon size={22} />,      badge: 0 },
  ];

  return (
    <>
      <Navbar profile={profile} navItems={clientNav} />
      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-20 pb-24 md:pb-12">
        {trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 2 && (
          <div className="mb-4 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <p className="text-sm text-[#C9A84C] font-medium">
                {trialDaysLeft === 1 ? t("trial_ends_tomorrow") : t("trial_ends_2days")}
              </p>
            </div>
            <form action={subscribeAction} className="shrink-0">
              <button
                type="submit"
                className="text-xs font-bold text-black bg-[#C9A84C] rounded-lg px-3 py-1.5 hover:bg-[#A8893A] transition-colors"
              >
                {t("subscribe")}
              </button>
            </form>
          </div>
        )}
        {children}
      </main>
      <BottomNav items={clientBottomNav} userId={userId} />
    </>
  );
}
