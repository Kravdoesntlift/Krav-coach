import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST — receive health data from Apple Shortcuts or any token-authenticated source
// Body: { token, steps?, water_ml?, date?, source? }
// date defaults to today (UTC) if omitted
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { token, steps, water_ml, date, source } = body as {
    token?: string;
    steps?: number;
    water_ml?: number;
    date?: string;
    source?: string;
  };

  if (!token) return NextResponse.json({ error: "token obrigatório." }, { status: 400 });

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
  const logDate = date ?? new Date().toISOString().slice(0, 10);

  // Build update payload — only update fields that were sent
  const updates: Record<string, unknown> = {
    client_id: clientId,
    log_date: logDate,
    updated_at: new Date().toISOString(),
  };
  if (typeof steps === "number") updates.steps = Math.max(0, Math.round(steps));
  if (typeof water_ml === "number") updates.water_ml = Math.max(0, Math.round(water_ml));

  // If neither steps nor water_ml provided, nothing to do
  if (updates.steps === undefined && updates.water_ml === undefined) {
    return NextResponse.json({ ok: true, message: "Nenhum dado para guardar." });
  }

  const { error } = await admin
    .from("daily_health_logs")
    .upsert(updates, { onConflict: "client_id,log_date" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    date: logDate,
    steps: updates.steps,
    water_ml: updates.water_ml,
    source: source ?? "api",
  });
}
