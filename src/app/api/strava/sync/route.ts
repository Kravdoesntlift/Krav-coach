import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

export const runtime = "nodejs";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;       // ISO 8601
  distance: number;         // metres
  moving_time: number;      // seconds
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  calories?: number;
}

// Estimate steps from Strava activity
function estimateSteps(activity: StravaActivity): number {
  const distanceKm = activity.distance / 1000;
  const type = activity.type.toLowerCase();

  if (type.includes("run") || type === "run") return Math.round(distanceKm * 1300);
  if (type.includes("walk") || type === "hike") return Math.round(distanceKm * 1400);
  if (type.includes("ride") || type.includes("cycle")) return Math.round(distanceKm * 200);
  return Math.round(distanceKm * 800);
}

// Map Strava sport type to app workout type
function stravaTypeToWorkoutType(stravaType: string): string {
  const t = stravaType.toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("hike") || t.includes("swim") || t.includes("ride") || t.includes("cycle") || t === "virtualride" || t === "ebike") return "cardio";
  if (t === "weighttraining" || t === "workout" || t.includes("crossfit") || t.includes("strength") || t === "rockclimbing") return "strength";
  if (t === "yoga") return "yoga";
  if (t.includes("mobility") || t.includes("stretch") || t.includes("pilates")) return "mobility";
  if (t.includes("soccer") || t.includes("basketball") || t.includes("tennis") || t.includes("football") || t.includes("sport") || t.includes("golf") || t.includes("rugby") || t.includes("surf")) return "sports";
  return "other";
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
    access_token: encrypt(data.access_token),
    refresh_token: encrypt(data.refresh_token),
    token_expires_at: new Date(data.expires_at * 1000).toISOString(),
  }).eq("id", integrationId);

  return data.access_token;
}

// POST — sync Strava activities: steps into daily_health_logs + workouts into client_workouts
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
  let accessToken: string = decrypt(integration.access_token);
  if (integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at).getTime();
    if (Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshStravaToken(decrypt(integration.refresh_token), integration.id, admin);
      if (!refreshed) {
        await admin.from("health_integrations").update({ is_active: false }).eq("id", integration.id);
        return NextResponse.json({ error: "Token Strava expirado. Reconecta o Strava." }, { status: 401 });
      }
      accessToken = refreshed;
    }
  }

  // Fetch activities from last 30 days to catch up on any missed sync
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!activitiesRes.ok) {
    return NextResponse.json({ error: "Erro ao obter atividades do Strava." }, { status: 502 });
  }

  const activities: StravaActivity[] = await activitiesRes.json();

  // 1. Steps — group by date and sum
  const byDate = new Map<string, number>();
  for (const act of activities) {
    const date = act.start_date.slice(0, 10);
    const steps = estimateSteps(act);
    byDate.set(date, (byDate.get(date) ?? 0) + steps);
  }

  const stepUpserts = Array.from(byDate.entries()).map(([date, steps]) => ({
    client_id: user.id,
    log_date: date,
    steps,
  }));

  if (stepUpserts.length > 0) {
    await admin
      .from("daily_health_logs")
      .upsert(stepUpserts, { onConflict: "client_id,log_date" });
  }

  // 2. Workouts — upsert each activity into client_workouts (deduplicated by external_id)
  const workoutUpserts = activities.map((act) => ({
    client_id: user.id,
    date: act.start_date.slice(0, 10),
    title: act.name || act.type,
    type: stravaTypeToWorkoutType(act.type),
    duration_min: act.moving_time > 0 ? Math.round(act.moving_time / 60) : null,
    calories: act.calories ?? null,
    distance_km: act.distance > 0 ? Math.round(act.distance / 10) / 100 : null,
    avg_heart_rate: act.average_heartrate ?? null,
    source: "strava",
    external_id: String(act.id),
  }));

  if (workoutUpserts.length > 0) {
    await admin
      .from("client_workouts")
      .upsert(workoutUpserts, { onConflict: "client_id,source,external_id" });
  }

  // Update last_synced_at
  await admin
    .from("health_integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  return NextResponse.json({
    ok: true,
    activitiesSynced: activities.length,
    workoutsImported: workoutUpserts.length,
    daysSynced: stepUpserts.length,
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
