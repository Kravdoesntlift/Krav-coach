import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Keep session alive for 400 days: prevents PWA logout on mobile
        maxAge: 400 * 24 * 60 * 60,
        sameSite: "lax",
        secure: true,
      },
    }
  );
}
