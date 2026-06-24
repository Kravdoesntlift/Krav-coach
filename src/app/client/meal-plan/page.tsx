import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/getLang";
import { t } from "@/lib/i18n";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Food {
  id: string;
  food_name: string;
  quantity: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  order_index: number;
}

interface Meal {
  id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  order_index: number;
  foods: Food[];
}

interface MealPlan {
  id: string;
  name: string;
  goal: "cut" | "bulk" | "maintenance";
  notes: string | null;
  created_at: string;
  meals: Meal[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🌅",
  lunch:     "☀️",
  dinner:    "🌙",
  snack:     "🍎",
};

const GOAL_LABEL: Record<string, { pt: string; en: string }> = {
  cut:         { pt: "Perder gordura", en: "Lose fat"     },
  bulk:        { pt: "Ganhar massa",   en: "Build muscle"  },
  maintenance: { pt: "Manutenção",     en: "Maintenance"   },
};

const GOAL_COLOR: Record<string, string> = {
  cut:         "text-blue-400 bg-blue-400/10",
  bulk:        "text-green-400 bg-green-400/10",
  maintenance: "text-brand-gold bg-brand-gold/10",
};

// ── Macro pill ─────────────────────────────────────────────────────────────────

function MacroPill({ label, value, unit = "g", color }: {
  label: string; value: number | null; unit?: string; color: string;
}) {
  if (value == null) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>
      {label}: {Math.round(value)}{unit}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function MealPlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const lang = await getLang();

  // Fetch the most recent meal plan assigned to this client
  const { data: planRow } = await supabase
    .from("meal_plans")
    .select("id, name, goal, notes, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let plan: MealPlan | null = null;

  if (planRow) {
    // Fetch meals
    const { data: mealsData } = await supabase
      .from("meal_plan_meals")
      .select("id, meal_type, name, order_index")
      .eq("plan_id", planRow.id)
      .order("order_index");

    const meals: Meal[] = [];

    for (const meal of mealsData ?? []) {
      const { data: foods } = await supabase
        .from("meal_plan_foods")
        .select("id, food_name, quantity, calories, protein_g, carbs_g, fat_g, notes, order_index")
        .eq("meal_id", meal.id)
        .order("order_index");

      meals.push({
        id:          meal.id,
        meal_type:   meal.meal_type as Meal["meal_type"],
        name:        meal.name,
        order_index: meal.order_index,
        foods:       (foods ?? []) as Food[],
      });
    }

    plan = {
      id:         planRow.id,
      name:       planRow.name,
      goal:       planRow.goal as MealPlan["goal"],
      notes:      planRow.notes ?? null,
      created_at: planRow.created_at,
      meals,
    };
  }

  // Compute daily totals
  const dailyTotals = plan?.meals.reduce(
    (acc, meal) => {
      const mt = meal.foods.reduce(
        (a, f) => ({
          calories:  a.calories  + (f.calories  ?? 0),
          protein_g: a.protein_g + (f.protein_g ?? 0),
          carbs_g:   a.carbs_g   + (f.carbs_g   ?? 0),
          fat_g:     a.fat_g     + (f.fat_g     ?? 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      );
      return {
        calories:  acc.calories  + mt.calories,
        protein_g: acc.protein_g + mt.protein_g,
        carbs_g:   acc.carbs_g   + mt.carbs_g,
        fat_g:     acc.fat_g     + mt.fat_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  ) ?? null;

  const pageTitle   = lang === "pt" ? "Plano Alimentar"    : "Meal Plan";
  const pageSubtitle = lang === "pt"
    ? "O teu plano personalizado de nutrição"
    : "Your personalised nutrition plan";
  const emptyTitle  = lang === "pt"
    ? "Sem plano alimentar"
    : "No meal plan yet";
  const emptyBody   = lang === "pt"
    ? "O teu coach ainda não criou um plano alimentar para ti."
    : "Your coach hasn't created a meal plan for you yet.";
  const dailyLabel  = lang === "pt" ? "Total diário" : "Daily total";
  const goalLabel   = (GOAL_LABEL[plan?.goal ?? ""] ?? GOAL_LABEL.maintenance)[lang];

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{pageSubtitle}</p>
      </div>

      {!plan ? (
        /* Empty state */
        <div className="card p-12 text-center space-y-4">
          <div className="text-6xl">🥗</div>
          <div>
            <p className="text-white font-semibold text-base">{emptyTitle}</p>
            <p className="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">{emptyBody}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Plan header card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="font-semibold text-white text-base">{plan.name}</h2>
                {plan.notes && (
                  <p className="text-zinc-500 text-sm mt-1 italic">{plan.notes}</p>
                )}
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${GOAL_COLOR[plan.goal] ?? "text-zinc-400 bg-zinc-800"}`}>
                {goalLabel}
              </span>
            </div>

            {/* Daily totals */}
            {dailyTotals && dailyTotals.calories > 0 && (
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}
              >
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">
                  {dailyLabel}
                </p>
                <div className="flex gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-brand-gold font-bold text-xl">{Math.round(dailyTotals.calories)}</p>
                    <p className="text-zinc-600 text-[10px]">kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-bold text-xl">{Math.round(dailyTotals.protein_g)}g</p>
                    <p className="text-zinc-600 text-[10px]">{lang === "pt" ? "proteína" : "protein"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-400 font-bold text-xl">{Math.round(dailyTotals.carbs_g)}g</p>
                    <p className="text-zinc-600 text-[10px]">{lang === "pt" ? "hidratos" : "carbs"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-pink-400 font-bold text-xl">{Math.round(dailyTotals.fat_g)}g</p>
                    <p className="text-zinc-600 text-[10px]">{lang === "pt" ? "gordura" : "fat"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Meals */}
          {plan.meals.map((meal) => {
            const mealTotals = meal.foods.reduce(
              (acc, f) => ({
                calories:  acc.calories  + (f.calories  ?? 0),
                protein_g: acc.protein_g + (f.protein_g ?? 0),
                carbs_g:   acc.carbs_g   + (f.carbs_g   ?? 0),
                fat_g:     acc.fat_g     + (f.fat_g     ?? 0),
              }),
              { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
            );

            return (
              <div key={meal.id} className="card p-4 space-y-3">
                {/* Meal header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MEAL_EMOJI[meal.meal_type] ?? "🍽️"}</span>
                    <h3 className="font-semibold text-white">{meal.name}</h3>
                  </div>
                  {mealTotals.calories > 0 && (
                    <span className="text-brand-gold text-sm font-semibold">
                      {Math.round(mealTotals.calories)} kcal
                    </span>
                  )}
                </div>

                {/* Meal macros summary */}
                {mealTotals.calories > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    <MacroPill label="P" value={mealTotals.protein_g} color="text-blue-400 bg-blue-400/10" />
                    <MacroPill label="C" value={mealTotals.carbs_g}   color="text-orange-400 bg-orange-400/10" />
                    <MacroPill label="G" value={mealTotals.fat_g}     color="text-pink-400 bg-pink-400/10" />
                  </div>
                )}

                {/* Foods list */}
                {meal.foods.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {meal.foods.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800/50 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm">{food.food_name}</p>
                            {food.quantity && (
                              <span className="text-zinc-600 text-xs">{food.quantity}</span>
                            )}
                          </div>
                          {food.notes && (
                            <p className="text-zinc-600 text-xs mt-0.5 italic">{food.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          {food.calories != null && (
                            <span className="text-brand-gold text-xs font-semibold">{food.calories} kcal</span>
                          )}
                          {(food.protein_g != null || food.carbs_g != null || food.fat_g != null) && (
                            <div className="flex gap-1">
                              <MacroPill label="P" value={food.protein_g} color="text-blue-400 bg-blue-400/10" />
                              <MacroPill label="C" value={food.carbs_g}   color="text-orange-400 bg-orange-400/10" />
                              <MacroPill label="G" value={food.fat_g}     color="text-pink-400 bg-pink-400/10" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {meal.foods.length === 0 && (
                  <p className="text-zinc-600 text-sm italic">
                    {lang === "pt" ? "Sem alimentos nesta refeição." : "No foods in this meal."}
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
