import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Nutrient ID → field mapping (values are per 100g in SR Legacy/Foundation)
const NUTRIENT_MAP: Record<number, string> = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  1004: "fat",
  1079: "fiber",
  2000: "sugar",
  1093: "sodium",
  1162: "vit_c",
  1114: "vit_d",
  1178: "vit_b12",
  1087: "calcium",
  1089: "iron",
  1092: "potassium",
  1090: "magnesium",
};

interface FDCNutrient {
  nutrientId: number;
  value: number;
}

interface FDCFood {
  fdcId: number;
  description: string;
  foodNutrients: FDCNutrient[];
}

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ foods: [] });

  const apiKey = process.env.FDC_API_KEY ?? "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${apiKey}&pageSize=12&dataType=SR%20Legacy,Foundation`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`FDC API error: ${res.status}`);
    const data = await res.json() as { foods?: FDCFood[] };

    const foods = (data.foods ?? []).map((f) => {
      const nutrients: Record<string, number | null> = {};
      for (const n of f.foodNutrients ?? []) {
        const field = NUTRIENT_MAP[n.nutrientId];
        if (field) nutrients[field] = Math.round(n.value * 10) / 10;
      }
      return {
        id: f.fdcId,
        name: f.description,
        per100g: {
          calories:   nutrients.calories   ?? null,
          protein:    nutrients.protein    ?? null,
          carbs:      nutrients.carbs      ?? null,
          fat:        nutrients.fat        ?? null,
          fiber:      nutrients.fiber      ?? null,
          sugar:      nutrients.sugar      ?? null,
          sodium:     nutrients.sodium     ?? null,
          vit_c:      nutrients.vit_c      ?? null,
          vit_d:      nutrients.vit_d      ?? null,
          vit_b12:    nutrients.vit_b12    ?? null,
          calcium:    nutrients.calcium    ?? null,
          iron:       nutrients.iron       ?? null,
          potassium:  nutrients.potassium  ?? null,
          magnesium:  nutrients.magnesium  ?? null,
        },
      };
    });

    return NextResponse.json({ foods });
  } catch (e) {
    console.error("[food/search]", e);
    return NextResponse.json({ error: "Erro a pesquisar alimentos. Tenta novamente." }, { status: 502 });
  }
}
