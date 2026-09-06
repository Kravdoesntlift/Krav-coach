import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ChatIcon, UserIcon, ChartIcon } from "@/components/ui/Icons";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import GlobalBadgeSync from "@/components/GlobalBadgeSync";
import InstallPrompt from "@/components/client/InstallPrompt";

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

  const [{ count: unreadCount }, { count: newLeadsCount }] = await Promise.all([
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .is("read_at", null),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const unread    = unreadCount ?? 0;
  const newLeads  = newLeadsCount ?? 0;

  // Desktop navbar: clean grouped structure
  const coachNav = [
    { href: "/coach/dashboard", label: "Clientes" },
    { href: "/coach/messages",  label: "Mensagens", badge: unread },
    { href: "/coach/plans/new", label: "Novo Plano" },
    { href: "/coach/analytics", label: "Analytics" },
    {
      label: "Perfil",
      children: [
        { href: "/coach/profile",        label: "👤 A minha conta" },
        { href: "/coach/sessions",       label: "📅 Sessões" },
        { href: "/coach/meal-plans",     label: "🥗 Planos Alimentares" },
        { href: "/coach/challenges",     label: "🏆 Desafio Mensal" },
        { href: "/coach/manage-clients", label: "⚙️ Gerir Clientes" },
        { href: "/coach/library",        label: "📚 Biblioteca" },
        { href: "/coach/leads",          label: "📧 Leads" },
        { href: "/coach/testimonials",   label: "⭐ Testemunhos" },
        { href: "/coach/setup",          label: "🚀 Configuração" },
        { href: "/coach/billing",        label: "💳 Faturação" },
      ],
    },
  ];

  // Bottom nav: 5 clean items, no more drawer
  const coachBottomNav = [
    { href: "/coach/dashboard", label: "Clientes",  icon: "👥",                   badge: 0        },
    { href: "/coach/messages",  label: "Chat",      icon: <ChatIcon size={22} />,  badge: unread   },
    { href: "/coach/leads",     label: "Leads",     icon: "📧",                    badge: newLeads },
    { href: "/coach/analytics", label: "Analytics", icon: <ChartIcon size={22} />, badge: 0        },
    { href: "/coach/profile",   label: "Perfil",    icon: <UserIcon size={22} />,  badge: 0        },
  ];

  return (
    <div className="min-h-screen bg-black">
      <ServiceWorkerRegister />
      <GlobalBadgeSync userId={user.id} />
      <InstallPrompt />
      <Navbar profile={profile} navItems={coachNav} />
      <main className="max-w-5xl mx-auto px-4 pt-6 md:pt-20 pb-24 md:pb-12">{children}</main>
      <BottomNav items={coachBottomNav} userId={user.id} />
    </div>
  );
}
