import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── In-process rate limiter (resets per cold start — good enough for serverless) ──
// Maps "ip:route_prefix" → [timestamps]
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ip: string, prefix: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${prefix}`;
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  // Prune old keys every ~500 calls to avoid memory growth
  if (rateLimitStore.size > 1000) {
    for (const [k, ts] of rateLimitStore) {
      if (ts.every((t) => now - t > windowMs)) rateLimitStore.delete(k);
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate limiting on sensitive endpoints ──────────────────────────────────
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  // AI generation: max 10 requests per minute per IP
  if (pathname.startsWith("/api/ai/")) {
    if (isRateLimited(ip, "/api/ai", 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Stripe webhook: max 100 per minute per IP (Stripe sends bursts)
  if (pathname.startsWith("/api/stripe/webhook")) {
    if (isRateLimited(ip, "/api/stripe/webhook", 100, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // Auth actions + signup: throttle credential SUBMISSIONS only.
  //
  // Never throttle GETs here. Loading /auth/login costs several requests on its
  // own (the document, plus Next.js prefetching the "forgot password" and
  // "/start" links), so a GET-inclusive limit burns through in two page views
  // and then serves a raw JSON body in place of the login page — indistinguishable
  // from the app being down. Brute-force protection only needs to cover POSTs.
  if (request.method === "POST" && (pathname.startsWith("/auth") || pathname === "/start")) {
    if (isRateLimited(ip, "/auth", 20, 60_000)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Demasiadas tentativas. Espera um minuto." },
        { status: 429 },
      );
    }
  }

  // Push subscribe: max 20 per minute per IP
  if (pathname.startsWith("/api/push/")) {
    if (isRateLimited(ip, "/api/push", 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // ── 2. Block common attack patterns ─────────────────────────────────────────
  // Reject requests with suspicious path traversal or injection attempts
  const suspiciousPatterns = [
    /\.\.\//,               // path traversal
    /<script/i,             // XSS in URL
    /union.*select/i,       // SQL injection
    /exec\s*\(/i,           // code injection
    /\.php$/i,              // PHP probing (not a PHP app)
    /wp-admin/i,            // WordPress scanning
    /\.env/i,               // env file probing
    /\/etc\/passwd/i,       // LFI
  ];
  if (suspiciousPatterns.some((p) => p.test(pathname))) {
    return new NextResponse(null, { status: 404 });
  }

  // ── 3. Supabase session + role-based routing ─────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/reset-password");
  const isProtected = pathname.startsWith("/client") || pathname.startsWith("/coach");

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (role === "coach") {
      return NextResponse.redirect(new URL("/coach/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
  }

  // Redirect clients based on account status
  if (user && pathname.startsWith("/client") &&
      !pathname.startsWith("/client/pending") &&
      !pathname.startsWith("/client/suspended") &&
      !pathname.startsWith("/client/chat")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "pending") {
      return NextResponse.redirect(new URL("/client/pending", request.url));
    }
    // "cancelled" is handled by the client layout (shows Stripe paywall)
    if (profile?.status === "archived" || profile?.status === "paused") {
      return NextResponse.redirect(new URL("/client/suspended", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
