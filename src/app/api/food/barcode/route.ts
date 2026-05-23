import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface OFFProduct {
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

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const barcode = req.nextUrl.searchParams.get("code")?.trim();
  if (!barcode) return NextResponse.json({ error: "Código em falta" }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=product_name,product_name_pt,product_name_en,brands,nutriments`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "KravCoach/1.0 (kravdoesntlift@gmail.com)" },
        next: { revalidate: 86400 },
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const data = await res.json() as { status: number; product?: OFFProduct };

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "Produto não encontrado na base de dados" }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments ?? {};

    if (n["energy-kcal_100g"] == null) {
      return NextResponse.json({ error: "Produto encontrado mas sem informação nutricional" }, { status: 422 });
    }

    const name = p.product_name_pt || p.product_name || p.product_name_en || "Produto";
    const brand = p.brands ? p.brands.split(",")[0].trim() : null;
    const displayName = brand ? `${name} (${brand})` : name;

    return NextResponse.json({
      food: {
        id: `off-${barcode}`,
        name: displayName,
        source: "off" as const,
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
  } catch (err) {
    console.error("[food/barcode] error:", err);
    return NextResponse.json({ error: "Erro ao consultar a base de dados" }, { status: 500 });
  }
}
