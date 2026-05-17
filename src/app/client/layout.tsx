import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { logout } from "@/app/auth/actions";
import type { NavItem } from "@/components/Navbar";
import { DumbbellIcon, ClipboardIcon, ChatIcon, ChartIcon, UserIcon, CalendarIcon, TrophyIcon, StarIcon, CameraIcon, FileIcon } from "@/components/ui/Icons";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PushPrompt from "@/components/PushPrompt";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/coach/dashboard");

  // Block access if account is paused or cancelled
  if (profile.status && profile.status !== "active") {
    const isPaused = profile.status === "paused";
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-8">
          <h1 className="text-3xl font-black tracking-tight text-white">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${
            isPaused ? "border-yellow-500/30 bg-yellow-500/10" : "border-red-500/30 bg-red-500/10"
          }`}>
            <span className="text-4xl">{isPaused ? "⏸" : "✕"}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">
              {isPaused ? "Conta temporariamente pausada" : "Conta cancelada"}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isPaused
                ? "O acesso está temporariamente suspenso. Contacta o teu coach para reactivar."
                : "O teu plano foi cancelado. Contacta o teu coach para mais informações."}
            </p>
          </div>
          <div className="h-px bg-zinc-800" />
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
              Terminar sessão
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unread messages count
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .is("read_at", null);

  const unread = unreadCount ?? 0;

  const clientNav: NavItem[] = [
    { href: "/client/dashboard", label: "Treino" },
    { href: "/client/checkin", label: "Check-in" },
    {
      label: "Evolução",
      children: [
        { href: "/client/progress", label: "Progressão" },
        { href: "/client/history", label: "Histórico" },
        { href: "/client/records", label: "PRs" },
        { href: "/client/achievements", label: "Conquistas" },
        { href: "/client/photos", label: "Fotos" },
        { href: "/client/report", label: "Relatório" },
        { href: "/client/weekly-report", label: "Rel. Semanal" },
      ],
    },
    { href: "/client/chat", label: "Chat", badge: unread },
    { href: "/client/profile", label: "Perfil" },
  ];

  const clientBottomNav = [
    { href: "/client/dashboard", label: "Treino",    icon: <DumbbellIcon size={22} />,   badge: 0 },
    { href: "/client/checkin",   label: "Check-in",  icon: <ClipboardIcon size={22} />,  badge: 0 },
    { href: "/client/chat",      label: "Chat",      icon: <ChatIcon size={22} />,       badge: unread },
    { href: "/client/progress",  label: "Progresso", icon: <ChartIcon size={22} />,      badge: 0 },
    { href: "/client/profile",   label: "Perfil",    icon: <UserIcon size={22} />,       badge: 0 },
  ];

  const clientBottomMoreNav = [
    { href: "/client/history",        label: "Histórico",  icon: <CalendarIcon size={24} />, badge: 0 },
    { href: "/client/records",        label: "PRs",        icon: <TrophyIcon size={24} />,   badge: 0 },
    { href: "/client/achievements",   label: "Conquistas", icon: <StarIcon size={24} />,     badge: 0 },
    { href: "/client/photos",         label: "Fotos",      icon: <CameraIcon size={24} />,   badge: 0 },
    { href: "/client/report",         label: "Relatório",  icon: <FileIcon size={24} />,     badge: 0 },
    { href: "/client/weekly-report",  label: "Rel. Semana", icon: <ChartIcon size={24} />,   badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-black">
      <ServiceWorkerRegister />
      <Navbar profile={profile} navItems={clientNav} />
      <main className="max-w-2xl mx-auto px-4 pt-6 md:pt-20 pb-24 md:pb-12">{children}</main>
      <BottomNav items={clientBottomNav} moreItems={clientBottomMoreNav} userId={user.id} />
      <PushPrompt />
    </div>
  );
}
