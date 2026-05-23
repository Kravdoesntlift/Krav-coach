import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET — redirect user to Strava OAuth consent page
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SITE_URL!));

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Strava não configurado." }, { status: 503 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/strava/callback`;

  // State = base64 of user id (used in callback to identify user)
  const state = Buffer.from(user.id).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all,profile:read_all",
    state,
  });

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
}
