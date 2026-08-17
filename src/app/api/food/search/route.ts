import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchLocalFoods } from "@/lib/pt-foods";

export const runtime = "nodejs";

/** A hit from Open Food Facts' Search-a-licious API. */
interface OFFHit {
  code?: string;
  product_name?: string;
  product_name_pt?: string;
  product_name_en?: string;
  brands?: string[] | string;
  countries_tags?: string[];
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

interface FoodResult {
  id: string;
  name: string;
  source: "off";
  per100g: Record<string, number | null>;
}

function round1(n: number | undefined | null): number | null {
  if (n == null || isNaN(n)) return null;
  return Math.round(n * 10) / 10;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lower-case and strip accents, so "Açúcar" and "acucar" compare equal. */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");

/**
 * Append the brand unless the name already carries it.
 *
 * Open Food Facts stores the brand separately from the product name, so much of
 * a range comes back as a bare descriptor — Nestum's products list as
 * "Chocolate", "Cereal", "5 Cereais". Searching "nestum" then returns a list in
 * which nothing looks like Nestum.
 */
function withBrand(name: string, brands?: string[] | string): string {
  const first = Array.isArray(brands) ? brands[0] : brands?.split(",")[0];
  const brand = first?.trim();
  if (!brand) return name;
  if (norm(name).includes(norm(brand))) return name;
  return `${name} — ${brand}`;
}

/** Characters that carry meaning in the Search-a-licious query syntax. */
const QUERY_SYNTAX = /[+\-!(){}[\]^"~*?:\\/&|]/g;

async function offRequest(query: string): Promise<OFFHit[]> {
  const url = new URL("https://search.openfoodfacts.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "50");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "KravCoach/1.0 (kravdoesntlift@gmail.com)" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    return ((await res.json()) as { hits?: OFFHit[] }).hits ?? [];
  } catch {
    return [];
  }
}

/**
 * Search Open Food Facts for branded products.
 *
 * Uses Search-a-licious, not the legacy `cgi/search.pl` endpoint: that one
 * rate-limits hard enough to fail 8 of 10 consecutive requests when measured,
 * and a failed lookup left the client staring at "no results".
 *
 * Two passes, because neither alone is good enough:
 *   - Restricted to products sold in Portugal, so local supermarket items
 *     surface. Its query parser only copes with `<one term> AND field:"value"`
 *     — parentheses or a second word silently return zero — so this pass uses
 *     just the leading token.
 *   - Plain full text, which reaches everything else.
 *
 * Relevance is then decided here rather than trusting the upstream ranking,
 * which put Swiss yoghurt above cereal for "nestum pro". Hits are scored by how
 * many of the typed words they actually contain, and anything matching none of
 * them is dropped.
 */
async function searchOFF(q: string, lang: string): Promise<FoodResult[]> {
  const safe = q.replace(QUERY_SYNTAX, " ").replace(/\s+/g, " ").trim();
  if (!safe) return [];

  const tokens = norm(safe).split(" ").filter((t) => t.length > 1);
  const lead = tokens[0] ?? safe;

  const [ptHits, globalHits] = await Promise.all([
    offRequest(`${lead} AND countries_tags:"en:portugal"`),
    offRequest(safe),
  ]);

  const seen = new Set<string>();
  const scored: { food: FoodResult; score: number; isPT: boolean }[] = [];

  for (const h of [...ptHits, ...globalHits]) {
    const n = h.nutriments;
    if (!h.code || n?.["energy-kcal_100g"] == null) continue;
    if (seen.has(h.code)) continue;
    seen.add(h.code);

    const brandText = Array.isArray(h.brands) ? h.brands.join(" ") : h.brands ?? "";
    const haystack = norm(`${h.product_name_pt ?? ""} ${h.product_name ?? ""} ${h.product_name_en ?? ""} ${brandText}`);
    const score = tokens.filter((t) => haystack.includes(t)).length;
    if (score === 0) continue;

    const base =
      lang === "en"
        ? h.product_name_en || h.product_name || h.product_name_pt || "Unknown product"
        : h.product_name_pt || h.product_name || h.product_name_en || "Produto desconhecido";

    scored.push({
      score,
      isPT: (h.countries_tags ?? []).includes("en:portugal"),
      food: {
        id: String(h.code),
        name: withBrand(base, h.brands),
        source: "off",
        per100g: {
          calories:  round1(n["energy-kcal_100g"]),
          protein:   round1(n.proteins_100g),
          carbs:     round1(n.carbohydrates_100g),
          fat:       round1(n.fat_100g),
          fiber:     round1(n.fiber_100g),
          sugar:     round1(n.sugars_100g),
          sodium:    n.sodium_100g != null ? Math.round(n.sodium_100g * 1000) : null,
          vit_c:     round1(n["vitamin-c_100g"]),
          vit_d:     round1(n["vitamin-d_100g"]),
          vit_b12:   round1(n["vitamin-b12_100g"]),
          calcium:   round1(n.calcium_100g),
          iron:      round1(n.iron_100g),
          potassium: round1(n.potassium_100g),
          magnesium: round1(n.magnesium_100g),
        },
      },
    });
  }

  // Closest match first; among equals, what you can buy in Portugal.
  scored.sort((a, b) => b.score - a.score || Number(b.isPT) - Number(a.isPT));
  return scored.map((s) => s.food);
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

  // Always consult Open Food Facts, even when the local list looks full. The
  // local table only holds generic foods, so short-circuiting on "aveia" or
  // "arroz" meant a branded supermarket product could never be found — which is
  // the whole reason someone types a brand name. Local hits still rank first.
  const localIds = new Set(localFoods.map((f) => f.id));

  const offFoods = await searchOFF(q, lang);

  // Cap the generic local hits so branded results always get room: "arroz"
  // alone fills 20 local entries, pushing every supermarket product off the end.
  const combined = [
    ...localFoods.slice(0, 10),
    ...offFoods.filter((f) => !localIds.has(f.id)),
  ].slice(0, 20);

  return NextResponse.json({ foods: combined });
}
