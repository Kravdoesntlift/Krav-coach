import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchLocalFoods } from "@/lib/pt-foods";

export const runtime = "nodejs";

interface OFFProduct {
  id: string;
  product_name?: string;
  product_name_pt?: string;
  product_name_en?: string;
  brands?: string;
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

/**
 * Append the brand unless the name already carries it.
 *
 * Open Food Facts stores the brand separately, so many products come back with
 * a bare descriptor — Nestum's range lists as "Chocolate", "Cereal", "5 Cereais".
 * Searching "nestum" then returns a list where nothing looks like Nestum.
 */
function withBrand(name: string, brands?: string): string {
  const brand = brands?.split(",")[0]?.trim();
  if (!brand) return name;
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm(name).includes(norm(brand))) return name;
  return `${name} — ${brand}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ foods: [] });
  if (q.length > 200) return NextResponse.json({ foods: [] });

  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "pt";

  // Always search local DB — for EN queries the search function translates terms internally
  const localFoods = searchLocalFoods(q, lang).map((f) => ({
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

  // Always consult Open Food Facts, even when the local list looks full.
  // The local DB only holds generic foods, so short-circuiting on "aveia" or
  // "arroz" meant branded supermarket products could never be found — the whole
  // reason someone searches for a brand by name. Local hits still rank first.
  const fields = [
    "id", "product_name", "product_name_pt", "product_name_en",
    "brands", "nutriments",
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
        const base = lang === "en"
          ? (p.product_name_en || p.product_name || p.product_name_pt || "Unknown product")
          : (p.product_name_pt || p.product_name || p.product_name_en || "Produto desconhecido");
        const name = withBrand(base, p.brands);
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

    // Cap the generic local hits so branded results always get room. "arroz"
    // alone fills 20 local entries, which would push every supermarket product
    // off the end of the list.
    const combined = [...localFoods.slice(0, 10), ...offFoods].slice(0, 20);
    return NextResponse.json({ foods: combined });
  } catch {
    // OFF failed or timed out — return local results only
    return NextResponse.json({ foods: localFoods });
  }
}
