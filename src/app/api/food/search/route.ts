import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchLocalFoods } from "@/lib/pt-foods";

export const runtime = "nodejs";

interface OFFProduct {
  id: string;
  product_name?: string;
  product_name_pt?: string;
  product_name_en?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    sodium_100g?: number;
    "vitamin-c_100g"?: number;
    "vitamin-d_100g"?: number;
    "vitamin-b12_100g"?: number;
    calcium_100g?: number;
    iron_100g?: number;
    potassium_100g?: number;
    magnesium_100g?: number;
  };
}

function round1(n: number | undefined | null): number | null {
  if (n == null || isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ foods: [] });

  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "pt";

  // 1. Search local Portuguese foods database first
  const localResults = searchLocalFoods(q);

  const localFoods = localResults.map((f) => ({
    id: f.id,
    name: f.name,
    source: "local" as const,
    per100g: {
      calories:   f.per100g.calories,
      protein:    f.per100g.protein,
      carbs:      f.per100g.carbs,
      fat:        f.per100g.fat,
      fiber:      f.per100g.fiber ?? null,
      sugar:      f.per100g.sugar ?? null,
      sodium:     f.per100g.sodium ?? null,
      vit_c:      null,
      vit_d:      null,
      vit_b12:    null,
      calcium:    null,
      iron:       null,
      potassium:  null,
      magnesium:  null,
    },
  }));

  // 2. If we have 5+ local results, return immediately (no external API call)
  if (localFoods.length >= 5) {
    return NextResponse.json({ foods: localFoods.slice(0, 20) });
  }

  // 3. Supplement with Open Food Facts (3-second timeout)
  const fields = [
    "id", "product_name", "product_name_pt", "product_name_en",
    "nutriments",
  ].join(",");

  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", q);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "15");
  url.searchParams.set("lc", lang);
  url.searchParams.set("fields", fields);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "KravCoach/1.0 (kravdoesntlift@gmail.com)" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`OFF API error: ${res.status}`);
    const data = await res.json() as { products?: OFFProduct[] };

    const localIds = new Set(localFoods.map((f) => f.id));

    const offFoods = (data.products ?? [])
      .filter((p) => {
        const n = p.nutriments;
        return n?.["energy-kcal_100g"] != null;
      })
      .map((p) => {
        const n = p.nutriments ?? {};
        const name = lang === "en"
          ? (p.product_name_en || p.product_name || p.product_name_pt || "Unknown product")
          : (p.product_name_pt || p.product_name || p.product_name_en || "Produto desconhecido");
        const sodiumMg = n.sodium_100g != null ? Math.round(n.sodium_100g * 1000) : null;
        return {
          id: String(p.id),
          name,
          source: "off" as const,
          per100g: {
            calories:   round1(n["energy-kcal_100g"]),
            protein:    round1(n.proteins_100g),
            carbs:      round1(n.carbohydrates_100g),
            fat:        round1(n.fat_100g),
            fiber:      round1(n.fiber_100g),
            sugar:      round1(n.sugars_100g),
            sodium:     sodiumMg,
            vit_c:      round1(n["vitamin-c_100g"]),
            vit_d:      round1(n["vitamin-d_100g"]),
            vit_b12:    round1(n["vitamin-b12_100g"]),
            calcium:    round1(n.calcium_100g),
            iron:       round1(n.iron_100g),
            potassium:  round1(n.potassium_100g),
            magnesium:  round1(n.magnesium_100g),
          },
        };
      })
      .filter((f) => !localIds.has(f.id));

    const combined = [...localFoods, ...offFoods].slice(0, 20);
    return NextResponse.json({ foods: combined });
  } catch {
    // OFF failed or timed out — return local results only
    return NextResponse.json({ foods: localFoods });
  }
}
