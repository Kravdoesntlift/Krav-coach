import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;       // ISO 8601
  distance: number;         // metres
  moving_time: number;      // seconds
  total_elevation_gain: number;
  average_heartrate?: number;
}

// Estimate steps from Strava activity
function estimateSteps(activity: StravaActivity): number {
  const distanceKm = activity.distance / 1000;
  const type = activity.type.toLowerCase();

  if (type.includes("run") || type === "run") return Math.round(distanceKm * 1300);
  if (type.includes("walk") || type === "hike") return Math.round(distanceKm * 1400);
  if (type.includes("ride") || type.includes("cycle")) return Math.round(distanceKm * 200);
  // Other activities: rough estimate
  return Math.round(distanceKm * 800);
}

async function refreshStravaToken(
  refreshToken: string,
  integrationId: string,
  admin: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  await admin.from("health_integrations").update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_expires_at: new Date(data.expires_at * 1000).toISOString(),
  }).eq("id", integrationId);

  return data.access_token;
}

// POST — sync today's (and yesterday's) Strava activities into daily_health_logs
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();

  const { data: integration } = await admin
    .from("health_integrations")
    .select("*")
    .eq("client_id", user.id)
    .eq("provider", "strava")
    .eq("is_active", true)
    .maybeSingle();

  if (!integration) {
    return NextResponse.json({ error: "Strava não ligado." }, { status: 404 });
  }

  // Refresh token if expired
  let accessToken: string = integration.access_token;
  if (integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at).getTime();
    if (Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshStravaToken(integration.refresh_token, integration.id, admin);
      if (!refreshed) {
        await admin.from("health_integrations").update({ is_active: false }).eq("id", integration.id);
        return NextResponse.json({ error: "Token Strava expirado. Reconecta o Strava." }, { status: 401 });
      }
      accessToken = refreshed;
    }
  }

  // Fetch activities from last 2 days
  const twoDaysAgo = Math.floor(Date.now() / 1000) - 2 * 86400;
  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${twoDaysAgo}&per_page=30`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!activitiesRes.ok) {
    return NextResponse.json({ error: "Erro ao obter atividades do Strava." }, { status: 502 });
  }

  const activities: StravaActivity[] = await activitiesRes.json();

  // Group by date and sum estimated steps
  const byDate = new Map<string, number>();
  for (const act of activities) {
    const date = act.start_date.slice(0, 10);
    const steps = estimateSteps(act);
    byDate.set(date, (byDate.get(date) ?? 0) + steps);
  }

  // Upsert into daily_health_logs
  const upserts = Array.from(byDate.entries()).map(([date, steps]) => ({
    client_id: user.id,
    log_date: date,
    steps,
  }));

  if (upserts.length > 0) {
    await admin
      .from("daily_health_logs")
      .upsert(upserts, { onConflict: "client_id,log_date" });
  }

  // Update last_synced_at
  await admin
    .from("health_integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  return NextResponse.json({
    ok: true,
    activitiesSynced: activities.length,
    daysSynced: upserts.length,
    summary: Object.fromEntries(byDate),
  });
}

// DELETE — disconnect Strava
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const admin = createAdminClient();
  await admin
    .from("health_integrations")
    .update({ is_active: false, access_token: "", refresh_token: "" })
    .eq("client_id", user.id)
    .eq("provider", "strava");

  return NextResponse.json({ ok: true });
}
