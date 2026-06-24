import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface FoodInput {
  food_name: string;
  quantity: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  order_index: number;
}

interface MealInput {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  order_index: number;
  foods: FoodInput[];
}

interface CreateMealPlanBody {
  client_id: string | null;
  name: string;
  goal: "cut" | "bulk" | "maintenance";
  notes: string | null;
  meals: MealInput[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: CreateMealPlanBody;
  try {
    body = await req.json() as CreateMealPlanBody;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  }

  // 1. Insert meal plan
  const { data: plan, error: planErr } = await supabase
    .from("meal_plans")
    .insert({
      coach_id:  user.id,
      client_id: body.client_id ?? null,
      name:      body.name.trim(),
      goal:      body.goal,
      notes:     body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? "Erro ao criar plano." }, { status: 500 });
  }

  // 2. Insert meals
  for (const meal of body.meals ?? []) {
    const { data: mealRow, error: mealErr } = await supabase
      .from("meal_plan_meals")
      .insert({
        plan_id:     plan.id,
        meal_type:   meal.meal_type,
        name:        meal.name.trim(),
        order_index: meal.order_index,
      })
      .select("id")
      .single();

    if (mealErr || !mealRow) continue;

    // 3. Insert foods for this meal
    if (meal.foods && meal.foods.length > 0) {
      await supabase.from("meal_plan_foods").insert(
        meal.foods.map((f) => ({
          meal_id:     mealRow.id,
          food_name:   f.food_name,
          quantity:    f.quantity ?? null,
          calories:    f.calories ?? null,
          protein_g:   f.protein_g ?? null,
          carbs_g:     f.carbs_g ?? null,
          fat_g:       f.fat_g ?? null,
          notes:       f.notes ?? null,
          order_index: f.order_index,
        }))
      );
    }
  }

  return NextResponse.json({ id: plan.id }, { status: 201 });
}
