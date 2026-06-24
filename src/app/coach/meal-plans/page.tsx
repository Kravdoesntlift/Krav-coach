import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const GOAL_LABEL: Record<string, string> = {
  cut:         "Perder gordura",
  bulk:        "Ganhar massa",
  maintenance: "Manutenção",
};

const GOAL_COLOR: Record<string, string> = {
  cut:         "text-blue-400 bg-blue-400/10",
  bulk:        "text-green-400 bg-green-400/10",
  maintenance: "text-brand-gold bg-brand-gold/10",
};

interface MealPlanRow {
  id: string;
  name: string;
  goal: string;
  notes: string | null;
  created_at: string;
  client: { id: string; full_name: string } | null;
}

export default async function MealPlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawPlans } = await supabase
    .from("meal_plans")
    .select("id, name, goal, notes, created_at, client:profiles!meal_plans_client_id_fkey(id, full_name)")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const plans: MealPlanRow[] = (rawPlans ?? []).map((p) => ({
    id:         p.id,
    name:       p.name,
    goal:       p.goal,
    notes:      p.notes ?? null,
    created_at: p.created_at,
    client:     p.client as unknown as { id: string; full_name: string } | null,
  }));

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <Link href="/coach/dashboard" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Planos Alimentares</span>
          </nav>
          <h1 className="text-2xl font-bold text-white">Planos Alimentares</h1>
          <p className="text-gray-400 text-sm mt-1">
            {plans.length} plano{plans.length !== 1 ? "s" : ""} criado{plans.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/coach/meal-plans/new"
          className="btn-primary whitespace-nowrap"
        >
          + Novo plano
        </Link>
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="text-5xl">🥗</div>
          <div>
            <p className="text-white font-semibold">Sem planos alimentares</p>
            <p className="text-zinc-500 text-sm mt-1">
              Cria o primeiro plano alimentar para os teus clientes.
            </p>
          </div>
          <Link href="/coach/meal-plans/new" className="btn-primary inline-block text-sm">
            + Criar plano
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const date = new Date(plan.created_at).toLocaleDateString("pt-PT", {
              day: "numeric", month: "short", year: "numeric",
            });
            const goalColor = GOAL_COLOR[plan.goal] ?? "text-zinc-400 bg-zinc-800";
            const goalLabel = GOAL_LABEL[plan.goal] ?? plan.goal;

            return (
              <div key={plan.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{plan.name}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${goalColor}`}>
                        {goalLabel}
                      </span>
                    </div>
                    {plan.client && (
                      <p className="text-zinc-400 text-sm">
                        Cliente: <span className="text-white">{plan.client.full_name}</span>
                      </p>
                    )}
                    {plan.notes && (
                      <p className="text-zinc-500 text-xs line-clamp-2 italic">{plan.notes}</p>
                    )}
                    <p className="text-zinc-600 text-xs">{date}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {/* Future: link to edit or view */}
                    <span className="text-zinc-600 text-xs">🥗</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
