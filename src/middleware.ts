import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
  const { pathname } = request.nextUrl;

  // /auth/callback and /auth/reset-password must NOT redirect even when logged in
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

  // Redirect pending clients — allow only /client/pending and /client/chat
  if (user && pathname.startsWith("/client") &&
      !pathname.startsWith("/client/pending") &&
      !pathname.startsWith("/client/chat")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profile?.status === "pending") {
      return NextResponse.redirect(new URL("/client/pending", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
