import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL!));

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Strava não configurado." }, { status: 503 });

  // CSRF: encode userId + random nonce, store nonce in cookie
  const nonce = crypto.randomUUID();
  const state = Buffer.from(JSON.stringify({ uid: user.id, nonce })).toString("base64url");

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all,profile:read_all",
    state,
  });

  const response = NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);

  // Store nonce in a short-lived HttpOnly cookie (10 min)
  response.cookies.set("strava_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
