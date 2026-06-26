import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

  if (error || !code || !state) {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_denied`);
  }

  // Decode state and verify CSRF nonce against cookie
  let uid: string;
  let nonce: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8")) as { uid: string; nonce: string };
    uid = decoded.uid;
    nonce = decoded.nonce;
  } catch {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_state`);
  }

  const cookieNonce = req.cookies.get("strava_oauth_nonce")?.value;
  if (!cookieNonce || cookieNonce !== nonce) {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_csrf`);
  }

  // Re-verify active session matches the uid in state to prevent token hijacking
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  if (!sessionUser || sessionUser.id !== uid) {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_session`);
  }

  // Exchange code for token
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_token`);
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: { id: number };
  };

  const { encrypt } = await import("@/lib/crypto");
  const admin = createAdminClient();
  const { error: dbErr } = await admin
    .from("health_integrations")
    .upsert(
      {
        client_id: uid,
        provider: "strava",
        access_token: encrypt(tokenData.access_token),
        refresh_token: encrypt(tokenData.refresh_token),
        token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        provider_user_id: String(tokenData.athlete.id),
        is_active: true,
      },
      { onConflict: "client_id,provider" }
    );

  if (dbErr) {
    return NextResponse.redirect(`${siteUrl}/client/integrations?error=strava_save`);
  }

  const response = NextResponse.redirect(`${siteUrl}/client/integrations?connected=strava`);
  // Clear the nonce cookie
  response.cookies.delete("strava_oauth_nonce");
  return response;
}
