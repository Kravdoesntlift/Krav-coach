import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AutomationsClient from "./AutomationsClient";

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "coach") redirect("/auth/login");

  const { data: automations } = await supabase
    .from("coach_automations")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="page-enter space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/coach/dashboard" className="hover:text-brand-gold transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-white">Automações</span>
      </nav>

      <AutomationsClient
        initialAutomations={automations ?? []}
        coachId={user.id}
      />
    </div>
  );
}
