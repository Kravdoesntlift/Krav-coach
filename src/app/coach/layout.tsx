import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ChatIcon, UserIcon } from "@/components/ui/Icons";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";

export default async function CoachLayout({
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

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .is("read_at", null);

  const unread = unreadCount ?? 0;

  const coachNav = [
    { href: "/coach/dashboard", label: "Clientes" },
    { href: "/coach/messages",  label: "Mensagens", badge: unread },
    { href: "/coach/plans/new", label: "Novo Plano" },
    {
      label: "Ferramentas",
      children: [
        { href: "/coach/sessions",       label: "📅 Sessões" },
        { href: "/coach/automations",    label: "⚡ Automações" },
        { href: "/coach/library",        label: "📚 Biblioteca" },
        { href: "/coach/results",        label: "🏆 Resultados" },
        { href: "/coach/manage-clients", label: "⚙️ Gerir Clientes" },
        { href: "/coach/billing",        label: "💳 Faturação" },
      ],
    },
    { href: "/coach/profile",   label: "Perfil" },
  ];

  const coachBottomNav = [
    { href: "/coach/dashboard", label: "Clientes",   icon: "👥",                  badge: 0      },
    { href: "/coach/messages",  label: "Mensagens",  icon: <ChatIcon size={22} />, badge: unread },
    { href: "/coach/plans/new", label: "Novo Plano", icon: "+",                    badge: 0      },
    { href: "/coach/profile",   label: "Perfil",     icon: <UserIcon size={22} />, badge: 0      },
  ];

  const coachBottomMoreNav = [
    { href: "/coach/sessions",       label: "Sessões",     icon: "📅", badge: 0 },
    { href: "/coach/automations",    label: "Automações",  icon: "⚡", badge: 0 },
    { href: "/coach/library",        label: "Biblioteca",  icon: "📚", badge: 0 },
    { href: "/coach/results",        label: "Resultados",  icon: "🏆", badge: 0 },
    { href: "/coach/manage-clients", label: "Gerir",       icon: "⚙️", badge: 0 },
    { href: "/coach/billing",        label: "Faturação",   icon: "💳", badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-black">
      <ServiceWorkerRegister />
      <GlobalBadgeSync userId={user.id} />
      <Navbar profile={profile} navItems={coachNav} />
      <main className="max-w-5xl mx-auto px-4 pt-6 md:pt-20 pb-24 md:pb-12">{children}</main>
      <BottomNav items={coachBottomNav} moreItems={coachBottomMoreNav} userId={user.id} />
    </div>
  );
}
