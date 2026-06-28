import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Simple in-process rate limiter: max 20 requests per token per hour
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// iOS Shortcuts can send numbers as strings — coerce safely
function toInt(v: unknown): number | null {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.round(v) : NaN;
  return isFinite(n) && n >= 0 ? n : null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { token, steps, water_ml, date, source, workout_minutes, active_calories } = body as {
    token?: string;
    steps?: number | string;
    water_ml?: number | string;
    date?: string;
    source?: string;
    workout_minutes?: number | string;
    active_calories?: number | string;
  };

  if (!token) return NextResponse.json({ error: "token obrigatório." }, { status: 400 });

  // Rate limit by token (prefix to avoid collisions)
  if (isRateLimited(`sync:${token}`)) {
    return NextResponse.json({ error: "Demasiados pedidos. Tenta mais tarde." }, { status: 429 });
  }

  const admin = createAdminClient();

  // Resolve client from token
  const { data: tokenRow } = await admin
    .from("health_tokens")
    .select("client_id")
    .eq("sync_token", token)
    .maybeSingle();

  if (!tokenRow) return NextResponse.json({ error: "Token inválido." }, { status: 401 });

  const clientId = tokenRow.client_id;

  // Use provided date or today in UTC (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const rawDate = date ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || isNaN(Date.parse(rawDate))) {
    return NextResponse.json({ error: "date inválido." }, { status: 400 });
  }
  const daysDiff = (Date.parse(today) - Date.parse(rawDate)) / 86_400_000;
  if (daysDiff < 0 || daysDiff > 30) {
    return NextResponse.json({ error: "date fora do intervalo permitido (últimos 30 dias)." }, { status: 400 });
  }
  const logDate = rawDate;

  // Build update payload — coerce all numeric fields (Shortcuts sends strings)
  const updates: Record<string, unknown> = {
    client_id: clientId,
    log_date: logDate,
    updated_at: new Date().toISOString(),
  };

  const stepsVal = toInt(steps);
  const waterVal = toInt(water_ml);
  const workoutVal = toInt(workout_minutes);
  const calVal = toInt(active_calories);

  if (stepsVal !== null) updates.steps = stepsVal;
  if (waterVal !== null) updates.water_ml = waterVal;
  if (workoutVal !== null) updates.workout_minutes = workoutVal;
  if (calVal !== null) updates.active_calories = calVal;

  // Nothing to do if no data fields were provided
  if (Object.keys(updates).length <= 3) {
    return NextResponse.json({ ok: true, message: "Nenhum dado para guardar." });
  }

  const { error } = await admin
    .from("daily_health_logs")
    .upsert(updates, { onConflict: "client_id,log_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    date: logDate,
    steps: stepsVal,
    water_ml: waterVal,
    workout_minutes: workoutVal,
    active_calories: calVal,
    source: source ?? "api",
  });
}
