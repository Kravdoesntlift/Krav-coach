"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NutritionLog, ClientNutritionGoals } from "@/lib/supabase/types";
import { searchLocalFoods } from "@/lib/pt-foods";
import { useLang } from "@/lib/i18n/useLang";

const BarcodeScanner = lazy(() => import("@/components/client/BarcodeScanner"));

// ─── TDEE calculation ─────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calcTDEE(g: ClientNutritionGoals): { calories: number; protein: number; carbs: number; fat: number } | null {
  if (!g.weight_kg || !g.height_cm || !g.age || !g.sex) return null;
  const bmr = g.sex === "M"
    ? 88.362 + (13.397 * g.weight_kg) + (4.799 * g.height_cm) - (5.677 * g.age)
    : 447.593 + (9.247 * g.weight_kg) + (3.098 * g.height_cm) - (4.330 * g.age);
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[g.activity_level] ?? 1.55);
  const adj = g.goal === "cut" ? -400 : g.goal === "bulk" ? 300 : 0;
  const calories = Math.round(tdee + adj);
  const protein  = Math.round(g.weight_kg * 2.0);
  const fat      = Math.round((calories * 0.25) / 9);
  const carbs    = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs: Math.max(0, carbs), fat };
}

// ─── Food search types ────────────────────────────────────────────────────────
interface FoodResult {
  id: string;
  name: string;
  source?: "local" | "custom" | "off";
  /** Pre-fills the quantity input when set (fast food, packaged items). */
  servingSize?: number;
  per100g: {
    calories: number | null; protein: number | null; carbs: number | null; fat: number | null;
    fiber: number | null; sugar: number | null; sodium: number | null;
    vit_c: number | null; vit_d: number | null; vit_b12: number | null;
    calcium: number | null; iron: number | null; potassium: number | null; magnesium: number | null;
  };
}

interface CustomFood {
  id: string;
  name: string;
  brand: string | null;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number | null;
}

interface CustomRecipe {
  id: string;
  name: string;
  portions: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  created_at: string;
}

interface RecipeIngredient {
  food_name: string;
  grams: number;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MEAL_PRESETS_PT = ["Pequeno-almoço", "Lanche manhã", "Almoço", "Lanche tarde", "Jantar", "Ceia"];
const MEAL_PRESETS_EN = ["Breakfast", "Morning snack", "Lunch", "Afternoon snack", "Dinner", "Evening snack"];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDate(iso: string, lang: "pt" | "en") {
  return new Date(iso + "T00:00:00").toLocaleDateString(lang === "pt" ? "pt-PT" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function scale(val: number | null, grams: number): number | null {
  return val != null ? Math.round((val * grams / 100) * 10) / 10 : null;
}

function customFoodToResult(cf: CustomFood): FoodResult {
  return {
    id: `custom_${cf.id}`,
    name: cf.brand ? `${cf.name} (${cf.brand})` : cf.name,
    source: "custom",
    per100g: {
      calories:  cf.calories_100g,
      protein:   cf.protein_100g,
      carbs:     cf.carbs_100g,
      fat:       cf.fat_100g,
      fiber:     cf.fiber_100g,
      sugar:     null,
      sodium:    null,
      vit_c:     null,
      vit_d:     null,
      vit_b12:   null,
      calcium:   null,
      iron:      null,
      potassium: null,
      magnesium: null,
    },
  };
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500 font-semibold uppercase tracking-wide">{label}</span>
        <span className={color}>{current} / {target}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : ""}`}
          style={{ width: `${pct}%`, background: pct >= 100 ? undefined : "linear-gradient(90deg,#E8C96B,#A8893A)" }} />
      </div>
    </div>
  );
}

// ─── Food search modal ────────────────────────────────────────────────────────
function FoodSearch({
  mealName,
  customFoods,
  onAdd,
  onClose,
  onCustomFoodCreated,
  lang,
}: {
  mealName: string;
  customFoods: CustomFood[];
  onAdd: (data: Partial<NutritionLog>) => void;
  onClose: () => void;
  onCustomFoodCreated: (cf: CustomFood) => void;
  lang: "pt" | "en";
}) {
  const { t } = useLang();
  const supabase = createClient();
  const [tab, setTab] = useState<"search" | "create" | "recipes">("search");

  const extra = {
    add_to_meal:         { pt: "Adicionar ao",                   en: "Add to" },
    close:               { pt: "Fechar",                         en: "Close" },
    tab_search:          { pt: "🔍 Pesquisar",                   en: "🔍 Search" },
    tab_create:          { pt: "➕ Criar",                       en: "➕ Create" },
    tab_recipes:         { pt: "🍽️ Receitas",                    en: "🍽️ Recipes" },
    search_placeholder:  { pt: "Ex: frango, aveia, banana...",   en: "E.g. chicken, oats, banana..." },
    scan_barcode_title:  { pt: "Scan código de barras",          en: "Scan barcode" },
    back_to_search:      { pt: "← Voltar à pesquisa",           en: "← Back to search" },
    my_label:            { pt: "MEU",                            en: "MINE" },
    prot_abbr:           { pt: "prot",                           en: "prot" },
    serving_abbr:        { pt: "porção",                         en: "serving" },
    per_100g:            { pt: "por 100g",                       en: "per 100g" },
    quantity_grams:      { pt: "Quantidade (gramas)",            en: "Quantity (grams)" },
    reset_serving:       { pt: "Repor porção",                   en: "Reset serving" },
    std_serving:         { pt: "porção padrão",                  en: "standard serving" },
    micronutrients:      { pt: "Micronutrientes",                en: "Micronutrients" },
    fiber_label:         { pt: "Fibra",                          en: "Fiber" },
    sugar_label:         { pt: "Açúcar",                         en: "Sugar" },
    sodium_label:        { pt: "Sódio",                          en: "Sodium" },
    vit_c_label:         { pt: "Vitamina C",                     en: "Vitamin C" },
    vit_d_label:         { pt: "Vitamina D",                     en: "Vitamin D" },
    vit_b12_label:       { pt: "Vitamina B12",                   en: "Vitamin B12" },
    calcium_label:       { pt: "Cálcio",                         en: "Calcium" },
    iron_label:          { pt: "Ferro",                          en: "Iron" },
    potassium_label:     { pt: "Potássio",                       en: "Potassium" },
    magnesium_label:     { pt: "Magnésio",                       en: "Magnesium" },
    no_results:          { pt: `Nenhum resultado para`,          en: "No results for" },
    try_create:          { pt: `Tenta criar em "➕ Criar".`,     en: `Try creating in "➕ Create".` },
    min_chars:           { pt: "Escreve pelo menos 2 letras para pesquisar", en: "Type at least 2 letters to search" },
    create_food_title:   { pt: "Criar alimento personalizado",   en: "Create custom food" },
    saved_for_future:    { pt: "Fica guardado na tua conta para uso futuro", en: "Saved to your account for future use" },
    food_name_label:     { pt: "Nome do alimento *",             en: "Food name *" },
    food_name_ph:        { pt: "Ex: Bolo de aveia caseiro",      en: "E.g. Homemade oat cake" },
    brand_label:         { pt: "Marca (opcional)",               en: "Brand (optional)" },
    brand_ph:            { pt: "Ex: Continente, caseiro...",     en: "E.g. Sainsbury's, homemade..." },
    cal_per_100g:        { pt: "Calorias por 100g *",            en: "Calories per 100g *" },
    protein_per_100g:    { pt: "Proteína (g/100g)",              en: "Protein (g/100g)" },
    carbs_per_100g:      { pt: "Hidratos (g/100g)",              en: "Carbs (g/100g)" },
    fat_per_100g:        { pt: "Gordura (g/100g)",               en: "Fat (g/100g)" },
    fiber_per_100g:      { pt: "Fibra (g/100g)",                 en: "Fiber (g/100g)" },
    saving:              { pt: "A guardar...",                    en: "Saving..." },
    save_and_select:     { pt: "Guardar e selecionar",           en: "Save and select" },
    name_required:       { pt: "Nome obrigatório.",              en: "Name required." },
    cal_required:        { pt: "Calorias obrigatórias.",         en: "Calories required." },
    save_error:          { pt: "Erro ao guardar. Tenta novamente.", en: "Save error. Please try again." },
    saved_recipes:       { pt: "Receitas guardadas",             en: "Saved recipes" },
    log_directly:        { pt: "Regista uma receita diretamente", en: "Log a recipe directly" },
    new_recipe_btn:      { pt: "+ Nova",                         en: "+ New" },
    no_recipes:          { pt: "Ainda não tens receitas guardadas", en: "You have no saved recipes yet" },
    click_new:           { pt: `Clica em "+ Nova" para criar`,   en: `Click "+ New" to create one` },
    per_portion:         { pt: "Por porção",                     en: "Per serving" },
    per_portion_of:      { pt: "Por porção",                     en: "Per serving" },
    total_portions:      { pt: "total",                          en: "total" },
    log_btn:             { pt: "Registar",                       en: "Log" },
    back:                { pt: "← Voltar",                       en: "← Back" },
    new_recipe_title:    { pt: "Nova receita",                   en: "New recipe" },
    recipe_name_label:   { pt: "Nome da receita *",              en: "Recipe name *" },
    recipe_name_ph:      { pt: "Ex: Panquecas de aveia",         en: "E.g. Oat pancakes" },
    portions_label:      { pt: "Número de porções",              en: "Number of servings" },
    ingredients_label:   { pt: "Ingredientes",                   en: "Ingredients" },
    search_ingredient_ph: { pt: "Pesquisar ingrediente...",      en: "Search ingredient..." },
    no_ing_results:      { pt: "Sem resultados",                 en: "No results" },
    quantity_g:          { pt: "Quantidade (g)",                 en: "Quantity (g)" },
    add_ingredient_btn:  { pt: "+ Adicionar ingrediente",        en: "+ Add ingredient" },
    recipe_total:        { pt: "Total receita",                  en: "Recipe total" },
    recipe_name_required: { pt: "Nome da receita obrigatório.",  en: "Recipe name required." },
    add_one_ingredient:  { pt: "Adiciona pelo menos um ingrediente.", en: "Add at least one ingredient." },
    recipe_save_error:   { pt: "Erro ao guardar receita.",       en: "Error saving recipe." },
    save_recipe:         { pt: "Guardar receita",                en: "Save recipe" },
    portion_label:       { pt: "porção",                         en: "serving" },
    hid_abbr:            { pt: "hid",                            en: "carbs" },
    gord_abbr:           { pt: "gord",                           en: "fat" },
  } as const;

  // ── Tab 1: Search state ──
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [grams, setGrams]       = useState("100");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Barcode scanner state ──
  const [showScanner, setShowScanner] = useState(false);

  // ── Tab 2: Create food state ──
  const [cfName,     setCfName]     = useState("");
  const [cfBrand,    setCfBrand]    = useState("");
  const [cfCal,      setCfCal]      = useState("");
  const [cfProt,     setCfProt]     = useState("");
  const [cfCarbs,    setCfCarbs]    = useState("");
  const [cfFat,      setCfFat]      = useState("");
  const [cfFiber,    setCfFiber]    = useState("");
  const [cfSaving,   setCfSaving]   = useState(false);
  const [cfError,    setCfError]    = useState<string | null>(null);

  // ── Tab 3: Recipes state ──
  const [recipes,        setRecipes]        = useState<CustomRecipe[]>([]);
  const [recipesLoaded,  setRecipesLoaded]  = useState(false);
  const [showNewRecipe,  setShowNewRecipe]  = useState(false);
  const [recipeName,     setRecipeName]     = useState("");
  const [recipePortions, setRecipePortions] = useState("1");
  const [ingredients,    setIngredients]    = useState<RecipeIngredient[]>([]);
  const [ingQuery,       setIngQuery]       = useState("");
  const [ingResults,     setIngResults]     = useState<FoodResult[]>([]);
  const [ingSelected,    setIngSelected]    = useState<FoodResult | null>(null);
  const [ingGrams,       setIngGrams]       = useState("100");
  const [recipeSaving,   setRecipeSaving]   = useState(false);
  const [recipeError,    setRecipeError]    = useState<string | null>(null);

  // ── Search with debounce ──
  useEffect(() => {
    if (tab !== "search") return;
    if (query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true); setSearchErr(null);
      try {
        // Search local PT foods
        const localMatches = searchLocalFoods(query).map((f) => ({
          id: f.id,
          name: f.name,
          source: "local" as const,
          servingSize: f.servingSize,
          per100g: {
            calories: f.per100g.calories, protein: f.per100g.protein,
            carbs: f.per100g.carbs, fat: f.per100g.fat,
            fiber: f.per100g.fiber ?? null, sugar: f.per100g.sugar ?? null,
            sodium: f.per100g.sodium ?? null,
            vit_c: null, vit_d: null, vit_b12: null,
            calcium: null, iron: null, potassium: null, magnesium: null,
          },
        }));

        // Search user's custom foods
        const queryLower = query.toLowerCase();
        const customMatches = customFoods
          .filter((cf) => cf.name.toLowerCase().includes(queryLower) || (cf.brand ?? "").toLowerCase().includes(queryLower))
          .map(customFoodToResult);

        // If we have 5+ combined, skip external API
        if (localMatches.length + customMatches.length >= 5) {
          setResults([...customMatches, ...localMatches].slice(0, 20));
          setSearching(false);
          return;
        }

        // Otherwise call the API (which also does local search server-side + OFF fallback)
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}&lang=${lang}`);
        const data = await res.json() as { foods?: FoodResult[]; error?: string };
        if (data.error) {
          setSearchErr(data.error);
          setResults([...customMatches, ...localMatches]);
        } else {
          const apiIds = new Set((data.foods ?? []).map((f) => f.id));
          const merged = [
            ...customMatches,
            ...(data.foods ?? []).filter((f) => !customMatches.some((c) => c.id === f.id)),
          ].slice(0, 20);
          void apiIds; // used implicitly
          setResults(merged);
        }
      } catch {
        // Fallback: just show local + custom results
        const localMatches = searchLocalFoods(query).map((f) => ({
          id: f.id, name: f.name, source: "local" as const,
          servingSize: f.servingSize,
          per100g: {
            calories: f.per100g.calories, protein: f.per100g.protein,
            carbs: f.per100g.carbs, fat: f.per100g.fat,
            fiber: f.per100g.fiber ?? null, sugar: f.per100g.sugar ?? null,
            sodium: f.per100g.sodium ?? null,
            vit_c: null, vit_d: null, vit_b12: null,
            calcium: null, iron: null, potassium: null, magnesium: null,
          },
        }));
        const queryLower = query.toLowerCase();
        const customMatches = customFoods
          .filter((cf) => cf.name.toLowerCase().includes(queryLower))
          .map(customFoodToResult);
        setResults([...customMatches, ...localMatches].slice(0, 20));
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ingredient search (for recipe builder) ──
  useEffect(() => {
    if (ingQuery.length < 2) { setIngResults([]); return; }
    const localMatches = searchLocalFoods(ingQuery).map((f) => ({
      id: f.id, name: f.name, source: "local" as const,
      servingSize: f.servingSize,
      per100g: {
        calories: f.per100g.calories, protein: f.per100g.protein,
        carbs: f.per100g.carbs, fat: f.per100g.fat,
        fiber: f.per100g.fiber ?? null, sugar: f.per100g.sugar ?? null,
        sodium: f.per100g.sodium ?? null,
        vit_c: null, vit_d: null, vit_b12: null,
        calcium: null, iron: null, potassium: null, magnesium: null,
      },
    }));
    const queryLower = ingQuery.toLowerCase();
    const customMatches = customFoods
      .filter((cf) => cf.name.toLowerCase().includes(queryLower))
      .map(customFoodToResult);
    setIngResults([...customMatches, ...localMatches].slice(0, 15));
  }, [ingQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load recipes when tab opens ──
  useEffect(() => {
    if (tab !== "recipes" || recipesLoaded) return;
    void (async () => {
      const { data } = await supabase.from("custom_recipes").select("*").order("created_at", { ascending: false });
      setRecipes((data as CustomRecipe[]) ?? []);
      setRecipesLoaded(true);
    })();
  }, [tab, recipesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const g = parseFloat(grams) || 100;
  const p = selected?.per100g;
  const scaled = p ? {
    calories:  scale(p.calories, g),
    protein:   scale(p.protein, g),
    carbs:     scale(p.carbs, g),
    fat:       scale(p.fat, g),
    fiber:     scale(p.fiber, g),
    sugar:     scale(p.sugar, g),
    sodium:    scale(p.sodium, g),
    vit_c:     scale(p.vit_c, g),
    vit_d:     scale(p.vit_d, g),
    vit_b12:   scale(p.vit_b12, g),
    calcium:   scale(p.calcium, g),
    iron:      scale(p.iron, g),
    potassium: scale(p.potassium, g),
    magnesium: scale(p.magnesium, g),
  } : null;

  function handleAdd() {
    if (!selected || !scaled) return;
    onAdd({
      meal_name:    mealName,
      description:  selected.name,
      calories:     scaled.calories != null ? Math.round(scaled.calories) : null,
      protein_g:    scaled.protein  != null ? Math.round(scaled.protein)  : null,
      carbs_g:      scaled.carbs    != null ? Math.round(scaled.carbs)    : null,
      fat_g:        scaled.fat      != null ? Math.round(scaled.fat)      : null,
      fiber_g:      scaled.fiber,
      sugar_g:      scaled.sugar,
      sodium_mg:    scaled.sodium   != null ? Math.round(scaled.sodium)   : null,
      vit_c_mg:     scaled.vit_c,
      vit_d_mcg:    scaled.vit_d,
      vit_b12_mcg:  scaled.vit_b12,
      calcium_mg:   scaled.calcium  != null ? Math.round(scaled.calcium)  : null,
      iron_mg:      scaled.iron,
      potassium_mg: scaled.potassium != null ? Math.round(scaled.potassium) : null,
      magnesium_mg: scaled.magnesium != null ? Math.round(scaled.magnesium) : null,
      food_id:      selected.id,
      serving_g:    Math.round(g),
    });
  }

  async function handleCreateFood() {
    if (!cfName.trim()) { setCfError(extra.name_required[lang]); return; }
    if (!cfCal) { setCfError(extra.cal_required[lang]); return; }
    setCfSaving(true); setCfError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCfSaving(false); return; }
    const { data, error } = await supabase.from("custom_foods").insert({
      client_id:    user.id,
      name:         cfName.trim(),
      brand:        cfBrand.trim() || null,
      calories_100g: parseFloat(cfCal),
      protein_100g:  parseFloat(cfProt) || 0,
      carbs_100g:    parseFloat(cfCarbs) || 0,
      fat_100g:      parseFloat(cfFat) || 0,
      fiber_100g:    cfFiber ? parseFloat(cfFiber) : null,
    }).select().single();
    if (error) { setCfError(extra.save_error[lang]); setCfSaving(false); return; }
    const newCf = data as CustomFood;
    onCustomFoodCreated(newCf);
    // Select it immediately in search tab
    setSelected(customFoodToResult(newCf));
    setGrams("100");
    setTab("search");
    setCfSaving(false);
  }

  // Recipe computed totals
  const recipeTotal = ingredients.reduce((acc, ing) => {
    const factor = ing.grams / 100;
    return {
      calories: acc.calories + (ing.calories_100g * factor),
      protein:  acc.protein  + (ing.protein_100g  * factor),
      carbs:    acc.carbs    + (ing.carbs_100g     * factor),
      fat:      acc.fat      + (ing.fat_100g       * factor),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const portions = parseInt(recipePortions) || 1;
  const perPortion = {
    calories: Math.round(recipeTotal.calories / portions),
    protein:  Math.round(recipeTotal.protein  / portions),
    carbs:    Math.round(recipeTotal.carbs     / portions),
    fat:      Math.round(recipeTotal.fat       / portions),
  };

  function addIngredient() {
    if (!ingSelected) return;
    const gAmt = parseFloat(ingGrams) || 100;
    setIngredients((prev) => [...prev, {
      food_name:    ingSelected.name,
      grams:        gAmt,
      calories_100g: ingSelected.per100g.calories ?? 0,
      protein_100g:  ingSelected.per100g.protein  ?? 0,
      carbs_100g:    ingSelected.per100g.carbs    ?? 0,
      fat_100g:      ingSelected.per100g.fat      ?? 0,
    }]);
    setIngSelected(null);
    setIngQuery("");
    setIngGrams("100");
  }

  async function handleSaveRecipe() {
    if (!recipeName.trim()) { setRecipeError(extra.recipe_name_required[lang]); return; }
    if (ingredients.length === 0) { setRecipeError(extra.add_one_ingredient[lang]); return; }
    setRecipeSaving(true); setRecipeError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRecipeSaving(false); return; }
    const { data: recipeData, error: recipeErr } = await supabase.from("custom_recipes").insert({
      client_id: user.id,
      name:      recipeName.trim(),
      portions,
      calories:  Math.round(recipeTotal.calories),
      protein_g: Math.round(recipeTotal.protein),
      carbs_g:   Math.round(recipeTotal.carbs),
      fat_g:     Math.round(recipeTotal.fat),
    }).select().single();
    if (recipeErr || !recipeData) { setRecipeError(extra.recipe_save_error[lang]); setRecipeSaving(false); return; }
    const recipeId = (recipeData as { id: string }).id;
    await supabase.from("custom_recipe_items").insert(
      ingredients.map((ing) => ({ recipe_id: recipeId, ...ing }))
    );
    const newRecipe: CustomRecipe = {
      id: recipeId,
      name: recipeName.trim(),
      portions,
      calories: Math.round(recipeTotal.calories),
      protein_g: Math.round(recipeTotal.protein),
      carbs_g: Math.round(recipeTotal.carbs),
      fat_g: Math.round(recipeTotal.fat),
      fiber_g: null,
      created_at: new Date().toISOString(),
    };
    setRecipes((prev) => [newRecipe, ...prev]);
    setShowNewRecipe(false);
    setRecipeName("");
    setRecipePortions("1");
    setIngredients([]);
    setRecipeSaving(false);
  }

  async function handleLogRecipe(recipe: CustomRecipe) {
    const p = recipe.portions > 1
      ? ` (1/${recipe.portions} ${extra.portion_label[lang]})`
      : "";
    onAdd({
      meal_name:   mealName,
      description: recipe.name + p,
      calories:    recipe.calories != null ? Math.round(recipe.calories / recipe.portions) : null,
      protein_g:   recipe.protein_g != null ? Math.round(recipe.protein_g / recipe.portions) : null,
      carbs_g:     recipe.carbs_g != null ? Math.round(recipe.carbs_g / recipe.portions) : null,
      fat_g:       recipe.fat_g != null ? Math.round(recipe.fat_g / recipe.portions) : null,
      fiber_g:     recipe.fiber_g != null ? recipe.fiber_g / recipe.portions : null,
    });
  }

  const TABS = [
    { key: "search",  label: extra.tab_search[lang] },
    { key: "create",  label: extra.tab_create[lang] },
    { key: "recipes", label: extra.tab_recipes[lang] },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div
        className="mt-auto max-h-[92dvh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="px-4 pb-8 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">{extra.add_to_meal[lang]} {mealName}</p>
            <button onClick={onClose} className="text-zinc-600 hover:text-white text-sm transition-colors">{extra.close[lang]}</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-zinc-900">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  tab === key ? "bg-brand-gold text-black" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab 1: Search ── */}
          {tab === "search" && (
            <div className="space-y-4">
              {/* Barcode scanner overlay */}
              {showScanner && (
                <Suspense fallback={null}>
                  <BarcodeScanner
                    onFound={(food) => {
                      setShowScanner(false);
                      setSelected(food);
                      setQuery(food.name);
                      setResults([]);
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                </Suspense>
              )}

              {/* Search input + barcode button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                    placeholder={extra.search_placeholder[lang]}
                    className="input text-sm pr-10"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Barcode scan button */}
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  title={extra.scan_barcode_title[lang]}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-brand-gold hover:border-brand-gold/40 transition-colors shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9V6a1 1 0 0 1 1-1h3M3 15v3a1 1 0 0 0 1 1h3M15 5h3a1 1 0 0 1 1 1v3M15 19h3a1 1 0 0 0 1-1v-3"/>
                    <line x1="7" y1="8" x2="7" y2="16"/>
                    <line x1="10" y1="8" x2="10" y2="16"/>
                    <line x1="13" y1="8" x2="13" y2="12"/>
                    <line x1="16" y1="8" x2="16" y2="16"/>
                    <line x1="13" y1="14" x2="13" y2="16"/>
                  </svg>
                </button>
              </div>

              {searchErr && <p className="text-red-400 text-xs">{searchErr}</p>}

              {/* Results */}
              {!selected && results.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {results.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setSelected(f); if (f.servingSize) setGrams(String(f.servingSize)); }}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {f.source === "custom" && (
                          <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-semibold shrink-0">{extra.my_label[lang]}</span>
                        )}
                        <p className="text-white text-sm">{f.name}</p>
                      </div>
                      <p className="text-zinc-500 text-[10px] mt-0.5">
                        {f.per100g.calories != null ? `${f.per100g.calories} kcal` : ""}
                        {f.per100g.protein != null ? ` · ${f.per100g.protein}g ${extra.prot_abbr[lang]}` : ""}
                        {f.servingSize ? ` · ${extra.serving_abbr[lang]}: ${f.servingSize}g` : ` · ${extra.per_100g[lang]}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected food + weight */}
              {selected && (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex items-center gap-2 text-brand-gold text-xs"
                  >
                    {extra.back_to_search[lang]}
                  </button>

                  <div className="rounded-xl p-3" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                    <div className="flex items-center gap-2">
                      {selected.source === "custom" && (
                        <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded font-semibold">{extra.my_label[lang]}</span>
                      )}
                      <p className="text-white text-sm font-semibold">{selected.name}</p>
                    </div>
                    <p className="text-zinc-500 text-[10px]">
                      {selected.servingSize ? `${extra.std_serving[lang]}: ${selected.servingSize}g` : extra.per_100g[lang]}
                    </p>
                  </div>

                  {/* Grams input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label">{extra.quantity_grams[lang]}</label>
                      {selected.servingSize && (
                        <button
                          type="button"
                          onClick={() => setGrams(String(selected.servingSize))}
                          className="text-[11px] text-brand-gold hover:underline"
                        >
                          {extra.reset_serving[lang]} ({selected.servingSize}g)
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      className="input text-sm"
                      min="1" max="2000"
                    />
                  </div>

                  {/* Calculated values */}
                  {scaled && (
                    <div className="space-y-3">
                      {/* Macros */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "kcal",                    val: scaled.calories,  color: "text-brand-gold" },
                          { label: t("protein").slice(0, 4),  val: scaled.protein != null ? `${scaled.protein}g` : null,  color: "text-blue-400" },
                          { label: t("carbs").slice(0, 4),    val: scaled.carbs   != null ? `${scaled.carbs}g`   : null,  color: "text-orange-400" },
                          { label: t("fat").slice(0, 4),      val: scaled.fat     != null ? `${scaled.fat}g`     : null,  color: "text-pink-400" },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="text-center rounded-xl py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className={`text-sm font-bold ${color}`}>{val ?? "—"}</p>
                            <p className="text-zinc-600 text-[9px]">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Micronutrients */}
                      {[scaled.fiber, scaled.sugar, scaled.sodium, scaled.vit_c, scaled.vit_d, scaled.vit_b12, scaled.calcium, scaled.iron, scaled.potassium, scaled.magnesium].some((v) => v != null && v > 0) && (
                        <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">{extra.micronutrients[lang]}</p>
                          {[
                            { label: extra.fiber_label[lang],     val: scaled.fiber,     unit: "g" },
                            { label: extra.sugar_label[lang],     val: scaled.sugar,     unit: "g" },
                            { label: extra.sodium_label[lang],    val: scaled.sodium,    unit: "mg" },
                            { label: extra.vit_c_label[lang],     val: scaled.vit_c,     unit: "mg" },
                            { label: extra.vit_d_label[lang],     val: scaled.vit_d,     unit: "mcg" },
                            { label: extra.vit_b12_label[lang],   val: scaled.vit_b12,   unit: "mcg" },
                            { label: extra.calcium_label[lang],   val: scaled.calcium,   unit: "mg" },
                            { label: extra.iron_label[lang],      val: scaled.iron,      unit: "mg" },
                            { label: extra.potassium_label[lang], val: scaled.potassium, unit: "mg" },
                            { label: extra.magnesium_label[lang], val: scaled.magnesium, unit: "mg" },
                          ].filter((r) => r.val != null && r.val > 0).map(({ label, val, unit }) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-zinc-500 text-xs">{label}</span>
                              <span className="text-zinc-300 text-xs font-medium">{val}{unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleAdd}
                    className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors"
                  >
                    {extra.add_to_meal[lang]} {mealName}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!searching && query.length >= 2 && results.length === 0 && !selected && (
                <p className="text-zinc-600 text-sm text-center py-4">
                  {extra.no_results[lang]} &quot;{query}&quot;. {extra.try_create[lang]}
                </p>
              )}

              {query.length < 2 && !selected && (
                <p className="text-zinc-700 text-xs text-center py-2">
                  {extra.min_chars[lang]}
                </p>
              )}
            </div>
          )}

          {/* ── Tab 2: Create food ── */}
          {tab === "create" && (
            <div className="space-y-4">
              <div>
                <p className="text-white font-semibold text-sm">{extra.create_food_title[lang]}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{extra.saved_for_future[lang]}</p>
              </div>

              <div>
                <label className="label">{extra.food_name_label[lang]}</label>
                <input value={cfName} onChange={(e) => setCfName(e.target.value)} className="input text-sm" placeholder={extra.food_name_ph[lang]} />
              </div>

              <div>
                <label className="label">{extra.brand_label[lang]}</label>
                <input value={cfBrand} onChange={(e) => setCfBrand(e.target.value)} className="input text-sm" placeholder={extra.brand_ph[lang]} />
              </div>

              <div>
                <label className="label text-brand-gold">{extra.cal_per_100g[lang]}</label>
                <input type="number" min="0" value={cfCal} onChange={(e) => setCfCal(e.target.value)} className="input text-sm" placeholder="0" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-blue-400">{extra.protein_per_100g[lang]}</label>
                  <input type="number" min="0" step="0.1" value={cfProt} onChange={(e) => setCfProt(e.target.value)} className="input text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="label text-orange-400">{extra.carbs_per_100g[lang]}</label>
                  <input type="number" min="0" step="0.1" value={cfCarbs} onChange={(e) => setCfCarbs(e.target.value)} className="input text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="label text-pink-400">{extra.fat_per_100g[lang]}</label>
                  <input type="number" min="0" step="0.1" value={cfFat} onChange={(e) => setCfFat(e.target.value)} className="input text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="label text-green-400">{extra.fiber_per_100g[lang]}</label>
                  <input type="number" min="0" step="0.1" value={cfFiber} onChange={(e) => setCfFiber(e.target.value)} className="input text-sm" placeholder="0" />
                </div>
              </div>

              {cfError && <p className="text-red-400 text-xs">{cfError}</p>}

              <button
                onClick={handleCreateFood}
                disabled={cfSaving}
                className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-40"
              >
                {cfSaving ? extra.saving[lang] : extra.save_and_select[lang]}
              </button>
            </div>
          )}

          {/* ── Tab 3: Recipes ── */}
          {tab === "recipes" && (
            <div className="space-y-4">
              {!showNewRecipe ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{extra.saved_recipes[lang]}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{extra.log_directly[lang]}</p>
                    </div>
                    <button
                      onClick={() => setShowNewRecipe(true)}
                      className="px-3 py-2 rounded-xl bg-brand-gold text-black text-xs font-bold"
                    >
                      {extra.new_recipe_btn[lang]}
                    </button>
                  </div>

                  {!recipesLoaded ? (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : recipes.length === 0 ? (
                    <div className="rounded-2xl p-8 text-center space-y-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <p className="text-2xl">🍽️</p>
                      <p className="text-zinc-500 text-sm">{extra.no_recipes[lang]}</p>
                      <p className="text-zinc-700 text-xs">{extra.click_new[lang]}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {recipes.map((recipe) => {
                        const perPort = {
                          cal:  recipe.calories  != null ? Math.round(recipe.calories  / recipe.portions) : null,
                          prot: recipe.protein_g != null ? Math.round(recipe.protein_g / recipe.portions) : null,
                          carbs: recipe.carbs_g  != null ? Math.round(recipe.carbs_g  / recipe.portions) : null,
                          fat:  recipe.fat_g     != null ? Math.round(recipe.fat_g    / recipe.portions) : null,
                        };
                        return (
                          <div key={recipe.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-white text-sm font-semibold">{recipe.name}</p>
                                <p className="text-zinc-600 text-[10px] mt-0.5">
                                  {recipe.portions > 1
                                    ? `${extra.per_portion_of[lang]} (${recipe.portions} ${extra.total_portions[lang]})`
                                    : extra.per_portion[lang]}
                                </p>
                                <div className="flex gap-3 mt-1 flex-wrap">
                                  {perPort.cal  != null && <span className="text-brand-gold  text-xs">{perPort.cal} kcal</span>}
                                  {perPort.prot != null && <span className="text-blue-400   text-xs">{perPort.prot}g {extra.prot_abbr[lang]}</span>}
                                  {perPort.carbs != null && <span className="text-orange-400 text-xs">{perPort.carbs}g {extra.hid_abbr[lang]}</span>}
                                  {perPort.fat  != null && <span className="text-pink-400   text-xs">{perPort.fat}g {extra.gord_abbr[lang]}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleLogRecipe(recipe)}
                                className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-gold text-black text-xs font-bold"
                              >
                                {extra.log_btn[lang]}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* ── New recipe builder ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowNewRecipe(false)} className="text-brand-gold text-xs">{extra.back[lang]}</button>
                    <p className="text-white font-semibold text-sm">{extra.new_recipe_title[lang]}</p>
                  </div>

                  <div>
                    <label className="label">{extra.recipe_name_label[lang]}</label>
                    <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} className="input text-sm" placeholder={extra.recipe_name_ph[lang]} />
                  </div>

                  <div>
                    <label className="label">{extra.portions_label[lang]}</label>
                    <input type="number" min="1" max="20" value={recipePortions} onChange={(e) => setRecipePortions(e.target.value)} className="input text-sm" />
                  </div>

                  {/* Ingredient search */}
                  <div>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">{extra.ingredients_label[lang]}</p>

                    {!ingSelected ? (
                      <div className="space-y-2">
                        <input
                          value={ingQuery}
                          onChange={(e) => setIngQuery(e.target.value)}
                          className="input text-sm"
                          placeholder={extra.search_ingredient_ph[lang]}
                        />
                        {ingResults.length > 0 && (
                          <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                            {ingResults.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => { setIngSelected(f); setIngQuery(""); setIngResults([]); }}
                                className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors rounded-xl"
                              >
                                <p className="text-white text-xs">{f.name}</p>
                                <p className="text-zinc-600 text-[10px]">{f.per100g.calories} kcal · {f.per100g.protein}g {extra.prot_abbr[lang]} /100g</p>
                              </button>
                            ))}
                          </div>
                        )}
                        {ingQuery.length >= 2 && ingResults.length === 0 && (
                          <p className="text-zinc-600 text-xs text-center py-2">{extra.no_ing_results[lang]}</p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                        <div className="flex items-center justify-between">
                          <p className="text-white text-xs font-semibold">{ingSelected.name}</p>
                          <button onClick={() => setIngSelected(null)} className="text-zinc-600 text-xs">✕</button>
                        </div>
                        <div>
                          <label className="label">{extra.quantity_g[lang]}</label>
                          <input
                            type="number"
                            min="1"
                            value={ingGrams}
                            onChange={(e) => setIngGrams(e.target.value)}
                            className="input text-sm"
                          />
                        </div>
                        <button
                          onClick={addIngredient}
                          className="w-full py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold"
                        >
                          {extra.add_ingredient_btn[lang]}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ingredient list */}
                  {ingredients.length > 0 && (
                    <div className="space-y-1.5">
                      {ingredients.map((ing, idx) => {
                        const factor = ing.grams / 100;
                        return (
                          <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div>
                              <p className="text-white text-xs">{ing.food_name}</p>
                              <p className="text-zinc-600 text-[10px]">
                                {ing.grams}g · {Math.round(ing.calories_100g * factor)} kcal · {Math.round(ing.protein_100g * factor)}g {extra.prot_abbr[lang]}
                              </p>
                            </div>
                            <button
                              onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-600 hover:text-red-400 text-xs ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Running totals */}
                  {ingredients.length > 0 && (
                    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest">
                        {extra.recipe_total[lang]}{portions > 1 ? ` · ${extra.per_portion[lang]} (÷${portions})` : ""}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "kcal", total: Math.round(recipeTotal.calories), pp: perPortion.calories, color: "text-brand-gold" },
                          { label: t("protein").slice(0, 4), total: Math.round(recipeTotal.protein),  pp: perPortion.protein,  color: "text-blue-400" },
                          { label: t("carbs").slice(0, 4),   total: Math.round(recipeTotal.carbs),    pp: perPortion.carbs,    color: "text-orange-400" },
                          { label: t("fat").slice(0, 4),     total: Math.round(recipeTotal.fat),      pp: perPortion.fat,      color: "text-pink-400" },
                        ].map(({ label, total, pp, color }) => (
                          <div key={label} className="text-center">
                            <p className={`text-xs font-bold ${color}`}>{portions > 1 ? pp : total}</p>
                            <p className="text-zinc-600 text-[9px]">{label}</p>
                            {portions > 1 && <p className="text-zinc-700 text-[8px]">{total} total</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipeError && <p className="text-red-400 text-xs">{recipeError}</p>}

                  <button
                    onClick={handleSaveRecipe}
                    disabled={recipeSaving}
                    className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-40"
                  >
                    {recipeSaving ? extra.saving[lang] : extra.save_recipe[lang]}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Goals setup modal ────────────────────────────────────────────────────────
function GoalsSetup({ existing, onSave, onClose, lang }: {
  existing: ClientNutritionGoals | null;
  onSave: (g: ClientNutritionGoals) => void;
  onClose: () => void;
  lang: "pt" | "en";
}) {
  const { t } = useLang();
  const supabase = createClient();
  const [weight,   setWeight]   = useState(String(existing?.weight_kg   ?? ""));
  const [height,   setHeight]   = useState(String(existing?.height_cm   ?? ""));
  const [age,      setAge]      = useState(String(existing?.age         ?? ""));
  const [sex,      setSex]      = useState<"M"|"F">(existing?.sex       ?? "M");
  const [activity, setActivity] = useState<ClientNutritionGoals["activity_level"]>(existing?.activity_level ?? "moderate");
  const [goal,     setGoal]     = useState<ClientNutritionGoals["goal"]>(existing?.goal ?? "maintenance");
  const [saving,   setSaving]   = useState(false);

  const extra = {
    configure_goals:     { pt: "Configurar objetivos",                        en: "Configure goals" },
    goals_subtitle:      { pt: "Para calcular as tuas necessidades diárias",  en: "To calculate your daily needs" },
    weight_label:        { pt: "Peso (kg)",                                   en: "Weight (kg)" },
    height_label:        { pt: "Altura (cm)",                                 en: "Height (cm)" },
    age_label:           { pt: "Idade",                                       en: "Age" },
    sex_label:           { pt: "Sexo",                                        en: "Sex" },
    sex_m:               { pt: "Masculino",                                   en: "Male" },
    sex_f:               { pt: "Feminino",                                    en: "Female" },
    activity_level:      { pt: "Nível de actividade",                         en: "Activity level" },
    goal_label:          { pt: "Objetivo",                                    en: "Goal" },
    saving:              { pt: "A guardar...",                                 en: "Saving..." },
    save:                { pt: "Guardar",                                      en: "Save" },
  } as const;

  const ACTIVITY_LABELS: Record<string, { pt: string; en: string }> = {
    sedentary:   { pt: "Sedentário (sem exercício)",  en: "Sedentary (no exercise)" },
    light:       { pt: "Ligeiro (1-3x/semana)",       en: "Light (1-3x/week)" },
    moderate:    { pt: "Moderado (3-5x/semana)",      en: "Moderate (3-5x/week)" },
    active:      { pt: "Activo (6-7x/semana)",        en: "Active (6-7x/week)" },
    very_active: { pt: "Muito activo (2x/dia)",       en: "Very active (2x/day)" },
  };

  const GOAL_LABELS: Record<string, { pt: string; en: string }> = {
    cut:         { pt: "Perder gordura",  en: "Cut (lose fat)" },
    maintenance: { pt: "Manutenção",      en: "Maintenance" },
    bulk:        { pt: "Ganhar massa",    en: "Bulk (gain muscle)" },
  };

  async function handleSave() {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setSaving(false); return; }

    const row: Omit<ClientNutritionGoals, "updated_at"> = {
      client_id:      user.user.id,
      goal:           goal,
      weight_kg:      parseFloat(weight) || null,
      height_cm:      parseInt(height)   || null,
      age:            parseInt(age)      || null,
      sex:            sex,
      activity_level: activity,
      target_calories:  null,
      target_protein_g: null,
      target_carbs_g:   null,
      target_fat_g:     null,
    };

    // Calculate targets
    const tdee = calcTDEE({ ...row, updated_at: "" });
    if (tdee) {
      row.target_calories  = tdee.calories;
      row.target_protein_g = tdee.protein;
      row.target_carbs_g   = tdee.carbs;
      row.target_fat_g     = tdee.fat;
    }

    await supabase.from("client_nutrition_goals").upsert(row, { onConflict: "client_id" });
    onSave({ ...row, updated_at: new Date().toISOString() });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div
        className="mt-auto max-h-[90dvh] overflow-y-auto rounded-t-3xl"
        style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>
        <div className="px-4 pb-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">{extra.configure_goals[lang]}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{extra.goals_subtitle[lang]}</p>
            </div>
            <button onClick={onClose} className="text-zinc-600 hover:text-white text-sm">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{extra.weight_label[lang]}</label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="input" placeholder="70" />
            </div>
            <div>
              <label className="label">{extra.height_label[lang]}</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="input" placeholder="175" />
            </div>
            <div>
              <label className="label">{extra.age_label[lang]}</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="input" placeholder="28" />
            </div>
            <div>
              <label className="label">{extra.sex_label[lang]}</label>
              <div className="flex gap-2 mt-1">
                {(["M", "F"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSex(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${sex === s ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400"}`}>
                    {s === "M" ? extra.sex_m[lang] : extra.sex_f[lang]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">{extra.activity_level[lang]}</label>
            <div className="space-y-1.5 mt-1">
              {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setActivity(k as ClientNutritionGoals["activity_level"])}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${activity === k ? "bg-brand-gold text-black font-semibold" : "bg-zinc-800/60 text-zinc-400 hover:text-white"}`}>
                  {v[lang]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{extra.goal_label[lang]}</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setGoal(k as ClientNutritionGoals["goal"])}
                  className={`py-3 rounded-xl text-xs font-semibold transition-colors ${goal === k ? "bg-brand-gold text-black" : "bg-zinc-800/60 text-zinc-400 hover:text-white"}`}>
                  {v[lang]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-40"
          >
            {saving ? extra.saving[lang] : extra.save[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NutritionPage() {
  const { t, lang } = useLang();
  const supabase = createClient();
  const [logs,        setLogs]        = useState<NutritionLog[]>([]);
  const [goals,       setGoals]       = useState<ClientNutritionGoals | null>(null);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [date,        setDate]        = useState(today());
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // UI state
  const [showGoalsModal,  setShowGoalsModal]  = useState(false);
  const [activeMeal,      setActiveMeal]      = useState<string | null>(null);
  const [showManual,      setShowManual]      = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Manual form state
  const [mealName,     setMealName]     = useState("");
  const [description,  setDescription]  = useState("");
  const [calories,     setCalories]     = useState("");
  const [protein,      setProtein]      = useState("");
  const [carbs,        setCarbs]        = useState("");
  const [fat,          setFat]          = useState("");
  const [saving,       setSaving]       = useState(false);

  const extra = {
    nutrition_title:     { pt: "Nutrição",                                        en: "Nutrition" },
    nutrition_subtitle:  { pt: "Regista as tuas refeições e macros diários",      en: "Log your meals and daily macros" },
    goals_btn:           { pt: "⚙ Objetivos",                                     en: "⚙ Goals" },
    today_label:         { pt: "Hoje",                                             en: "Today" },
    daily_progress:      { pt: "Progresso diário",                                en: "Daily progress" },
    protein_label:       { pt: "Proteína",                                        en: "Protein" },
    carbs_label:         { pt: "Hidratos",                                        en: "Carbs" },
    fat_label:           { pt: "Gordura",                                         en: "Fat" },
    setup_goals_btn:     { pt: "+ Configurar objetivos de nutrição e TDEE",       en: "+ Set up nutrition goals and TDEE" },
    add_meal:            { pt: "Adicionar refeição",                              en: "Add meal" },
    manual_cancel:       { pt: "Cancelar",                                        en: "Cancel" },
    manual_open:         { pt: "Inserir manualmente (sem pesquisa)",              en: "Enter manually (no search)" },
    meal_name_ph:        { pt: "Nome da refeição",                                en: "Meal name" },
    desc_ph:             { pt: "Descrição (opcional)",                            en: "Description (optional)" },
    cal_label:           { pt: "Calorias (kcal)",                                 en: "Calories (kcal)" },
    prot_label:          { pt: "Proteína (g)",                                    en: "Protein (g)" },
    carbs_label2:        { pt: "Hidratos (g)",                                    en: "Carbs (g)" },
    fat_label2:          { pt: "Gordura (g)",                                     en: "Fat (g)" },
    saving:              { pt: "A guardar...",                                     en: "Saving..." },
    save:                { pt: "Guardar",                                          en: "Save" },
    choose_meal_err:     { pt: "Escolhe uma refeição.",                           en: "Choose a meal." },
    delete_confirm:      { pt: "Apagar este registo?",                            en: "Delete this entry?" },
    no_logs_title:       { pt: "Sem registos para este dia",                      en: "No entries for this day" },
    no_logs_sub:         { pt: "Clica numa refeição acima para pesquisar alimentos", en: "Tap a meal above to search foods" },
    day_total_micro:     { pt: "Total do dia — Micronutrientes",                  en: "Daily total — Micronutrients" },
    fiber_label:         { pt: "Fibra",                                           en: "Fiber" },
    sodium_label:        { pt: "Sódio",                                           en: "Sodium" },
    vit_c_label:         { pt: "Vitamina C",                                      en: "Vitamin C" },
    calcium_label:       { pt: "Cálcio",                                          en: "Calcium" },
    iron_label:          { pt: "Ferro",                                           en: "Iron" },
    sodium_inline:       { pt: "Sódio",                                           en: "Sodium" },
    vit_c_inline:        { pt: "Vit C",                                           en: "Vit C" },
    calcium_inline:      { pt: "Cálcio",                                          en: "Calcium" },
    iron_inline:         { pt: "Ferro",                                           en: "Iron" },
    prot_abbr:           { pt: "prot",                                            en: "prot" },
    hid_abbr:            { pt: "hid",                                             en: "carbs" },
    gord_abbr:           { pt: "gord",                                            en: "fat" },
    fiber_abbr:          { pt: "fibra",                                           en: "fiber" },
  } as const;

  const MEAL_PRESETS = lang === "pt" ? MEAL_PRESETS_PT : MEAL_PRESETS_EN;

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: logsData }, { data: goalsData }, { data: cfData }] = await Promise.all([
      supabase.from("nutrition_logs").select("*").eq("logged_at", date).order("created_at"),
      supabase.from("client_nutrition_goals").select("*").eq("client_id", user.id).maybeSingle(),
      supabase.from("custom_foods").select("*").eq("client_id", user.id).order("name"),
    ]);

    setLogs(logsData ?? []);
    setGoals(goalsData ?? null);
    setCustomFoods((cfData as CustomFood[]) ?? []);
    setLoading(false);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadData(); }, [loadData]);

  // Totals for the day
  const totals = {
    calories:  logs.reduce((s, l) => s + (l.calories  ?? 0), 0),
    protein:   logs.reduce((s, l) => s + (l.protein_g ?? 0), 0),
    carbs:     logs.reduce((s, l) => s + (l.carbs_g   ?? 0), 0),
    fat:       logs.reduce((s, l) => s + (l.fat_g     ?? 0), 0),
    fiber:     logs.reduce((s, l) => s + (l.fiber_g   ?? 0), 0),
    sodium:    logs.reduce((s, l) => s + (l.sodium_mg ?? 0), 0),
    vit_c:     logs.reduce((s, l) => s + (l.vit_c_mg  ?? 0), 0),
    calcium:   logs.reduce((s, l) => s + (l.calcium_mg ?? 0), 0),
    iron:      logs.reduce((s, l) => s + (l.iron_mg   ?? 0), 0),
  };

  const tdee = goals ? calcTDEE(goals) : null;
  const targets = tdee ?? {
    calories:  goals?.target_calories  ?? 0,
    protein:   goals?.target_protein_g ?? 0,
    carbs:     goals?.target_carbs_g   ?? 0,
    fat:       goals?.target_fat_g     ?? 0,
  };

  async function addFromSearch(mealName: string, data: Partial<NutritionLog>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: inserted } = await supabase.from("nutrition_logs").insert({
      client_id: user.id, logged_at: date, ...data, meal_name: mealName,
    }).select().single();
    if (inserted) setLogs((prev) => [...prev, inserted as NutritionLog]);
    setActiveMeal(null);
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!mealName.trim()) { setError(extra.choose_meal_err[lang]); return; }
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: inserted } = await supabase.from("nutrition_logs").insert({
      client_id: user.id, logged_at: date,
      meal_name: mealName.trim(),
      description: description.trim() || null,
      calories:  calories ? parseInt(calories) : null,
      protein_g: protein  ? parseInt(protein)  : null,
      carbs_g:   carbs    ? parseInt(carbs)    : null,
      fat_g:     fat      ? parseInt(fat)      : null,
    }).select().single();
    if (inserted) setLogs((prev) => [...prev, inserted as NutritionLog]);
    setMealName(""); setDescription(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setShowManual(false); setSaving(false);
  }

  async function confirmDeleteLog(id: string) {
    await supabase.from("nutrition_logs").delete().eq("id", id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setPendingDeleteId(null);
  }

  function changeDay(delta: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const isToday = date === today();

  return (
    <div className="space-y-5 page-enter">
      {/* Modals */}
      {activeMeal && (
        <FoodSearch
          mealName={activeMeal}
          customFoods={customFoods}
          onAdd={(data) => addFromSearch(activeMeal, data)}
          onClose={() => setActiveMeal(null)}
          onCustomFoodCreated={(cf) => setCustomFoods((prev) => [...prev, cf])}
          lang={lang}
        />
      )}
      {showGoalsModal && (
        <GoalsSetup
          existing={goals}
          onSave={(g) => { setGoals(g); setShowGoalsModal(false); }}
          onClose={() => setShowGoalsModal(false)}
          lang={lang}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{extra.nutrition_title[lang]}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{extra.nutrition_subtitle[lang]}</p>
        </div>
        <button
          onClick={() => setShowGoalsModal(true)}
          className="text-xs text-zinc-500 hover:text-brand-gold transition-colors mt-1"
        >
          {extra.goals_btn[lang]}
        </button>
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDay(-1)} className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors text-lg leading-none">‹</button>
        <div className="text-center">
          <p className="text-white text-sm font-semibold capitalize">{fmtDate(date, lang)}</p>
          {isToday && <p className="text-brand-gold text-[10px]">{extra.today_label[lang]}</p>}
        </div>
        <button onClick={() => changeDay(1)} disabled={isToday}
          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:opacity-30 text-lg leading-none">›</button>
      </div>

      {/* Goals / progress bars */}
      {!loading && targets.calories > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white text-xs font-semibold">{extra.daily_progress[lang]}</p>
            <p className="text-brand-gold text-xs font-bold">{totals.calories} / {targets.calories} kcal</p>
          </div>
          <MacroBar label={extra.protein_label[lang]} current={totals.protein} target={targets.protein} color="text-blue-400" />
          <MacroBar label={extra.carbs_label[lang]}   current={totals.carbs}   target={targets.carbs}   color="text-orange-400" />
          <MacroBar label={extra.fat_label[lang]}     current={totals.fat}     target={targets.fat}     color="text-pink-400" />
        </div>
      )}

      {/* No goals set yet */}
      {!loading && !goals && (
        <button
          onClick={() => setShowGoalsModal(true)}
          className="w-full py-3 rounded-xl text-sm transition-colors text-zinc-400 hover:text-white"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px dashed rgba(201,168,76,0.25)" }}
        >
          {extra.setup_goals_btn[lang]}
        </button>
      )}

      {/* Add meal buttons */}
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">{extra.add_meal[lang]}</p>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMeal(m)}
              className="py-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowManual((v) => !v)}
          className="w-full py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showManual ? extra.manual_cancel[lang] : extra.manual_open[lang]}
        </button>
      </div>

      {/* Manual form */}
      {showManual && (
        <form onSubmit={addManual} className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEAL_PRESETS.map((m) => (
              <button key={m} type="button" onClick={() => setMealName(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mealName === m ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                {m}
              </button>
            ))}
          </div>
          <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder={extra.meal_name_ph[lang]} className="input text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={extra.desc_ph[lang]} rows={2} className="input text-sm resize-none" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: extra.cal_label[lang],   val: calories, set: setCalories, color: "text-brand-gold" },
              { label: extra.prot_label[lang],  val: protein,  set: setProtein,  color: "text-blue-400" },
              { label: extra.carbs_label2[lang], val: carbs,   set: setCarbs,    color: "text-orange-400" },
              { label: extra.fat_label2[lang],  val: fat,      set: setFat,      color: "text-pink-400" },
            ].map(({ label, val, set, color }) => (
              <div key={label}>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${color} block mb-1`}>{label}</label>
                <input type="number" min="0" value={val} onChange={(e) => set(e.target.value)} placeholder="—" className="input text-sm" />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-brand-gold text-black text-sm font-bold disabled:opacity-40">
            {saving ? extra.saving[lang] : extra.save[lang]}
          </button>
        </form>
      )}

      {/* Logs for the day */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl p-10 text-center space-y-3" style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}>
          <p className="text-4xl">🥗</p>
          <div>
            <p className="text-white font-bold text-sm">{extra.no_logs_title[lang]}</p>
            <p className="text-zinc-500 text-xs mt-1">{extra.no_logs_sub[lang]}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold">{log.meal_name}</p>
                  {log.description && <p className="text-zinc-500 text-xs mt-0.5 capitalize">{log.description}</p>}
                  {log.serving_g && <p className="text-zinc-700 text-[10px]">{log.serving_g}g</p>}
                </div>
                {pendingDeleteId === log.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => confirmDeleteLog(log.id)} className="text-red-400 text-xs px-2 py-0.5 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors">
                      {lang === "en" ? "Delete" : "Apagar"}
                    </button>
                    <button onClick={() => setPendingDeleteId(null)} className="text-zinc-500 text-xs px-2 py-0.5 rounded hover:text-white transition-colors">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setPendingDeleteId(log.id)} className="shrink-0 text-zinc-700 hover:text-red-400 text-xs transition-colors">✕</button>
                )}
              </div>
              {(log.calories || log.protein_g || log.carbs_g || log.fat_g) && (
                <div className="flex gap-3 pt-1 border-t border-zinc-800/60 flex-wrap">
                  {log.calories  != null && <span className="text-brand-gold  text-xs font-semibold">{log.calories} kcal</span>}
                  {log.protein_g != null && <span className="text-blue-400   text-xs">{log.protein_g}g {extra.prot_abbr[lang]}</span>}
                  {log.carbs_g   != null && <span className="text-orange-400 text-xs">{log.carbs_g}g {extra.hid_abbr[lang]}</span>}
                  {log.fat_g     != null && <span className="text-pink-400   text-xs">{log.fat_g}g {extra.gord_abbr[lang]}</span>}
                  {log.fiber_g   != null && <span className="text-green-400  text-xs">{log.fiber_g}g {extra.fiber_abbr[lang]}</span>}
                </div>
              )}
              {/* Micronutrients row */}
              {(log.vit_c_mg || log.calcium_mg || log.iron_mg || log.sodium_mg) && (
                <div className="flex gap-3 flex-wrap">
                  {log.sodium_mg   != null && <span className="text-zinc-500 text-[10px]">{extra.sodium_inline[lang]} {log.sodium_mg}mg</span>}
                  {log.vit_c_mg    != null && <span className="text-zinc-500 text-[10px]">{extra.vit_c_inline[lang]} {log.vit_c_mg}mg</span>}
                  {log.calcium_mg  != null && <span className="text-zinc-500 text-[10px]">{extra.calcium_inline[lang]} {log.calcium_mg}mg</span>}
                  {log.iron_mg     != null && <span className="text-zinc-500 text-[10px]">{extra.iron_inline[lang]} {log.iron_mg}mg</span>}
                </div>
              )}
            </div>
          ))}

          {/* Day totals at bottom */}
          {totals.sodium > 0 || totals.vit_c > 0 || totals.calcium > 0 ? (
            <div className="card p-3 space-y-1">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">{extra.day_total_micro[lang]}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { label: extra.fiber_label[lang],   val: totals.fiber,   unit: "g" },
                  { label: extra.sodium_label[lang],  val: totals.sodium,  unit: "mg" },
                  { label: extra.vit_c_label[lang],   val: totals.vit_c,   unit: "mg" },
                  { label: extra.calcium_label[lang], val: totals.calcium, unit: "mg" },
                  { label: extra.iron_label[lang],    val: totals.iron,    unit: "mg" },
                ].filter((r) => r.val > 0).map(({ label, val, unit }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-zinc-600 text-xs">{label}</span>
                    <span className="text-zinc-400 text-xs font-medium">{Math.round(val * 10) / 10}{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
