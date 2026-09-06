import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback: exchanges the PKCE code Supabase sends in the email link
 * for a real session, then redirects to `next` (or /client/dashboard).
 *
 * Used by:
 *  - Email confirmation  (type=signup)   → redirects to /client/dashboard
 *  - Password reset      (type=recovery) → redirects to /auth/reset-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/client/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Use the request origin so this works on any environment (localhost, Vercel, etc.)
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] code exchange error:", error.message);
  }

  // Something went wrong: send back to login with a hint
  return NextResponse.redirect(`${origin}/auth/login?error=link_expirado`);
}
