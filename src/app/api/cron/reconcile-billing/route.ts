import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reconcileBilling } from "@/lib/billing/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reconcile-billing
 *
 * Thin wrapper: this route exists so Vercel's scheduler has something to call.
 * The work lives in @/lib/billing/reconcile, shared with the "Sincronizar
 * agora" button on the coach's billing page.
 */

/** Allow the Vercel cron (Bearer secret) or a signed-in coach running it manually. */
async function isAuthorised(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // An unset $CRON_SECRET in someone's shell sends a literally empty bearer;
  // never let that match a missing server-side secret.
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    return profile?.role === "coach";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorised(req))) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Inicia sessão como coach e usa o botão 'Sincronizar agora' em /coach/billing.",
      },
      { status: 401 },
    );
  }

  const result = await reconcileBilling();
  if ("error" in result) return NextResponse.json(result, { status: 503 });
  return NextResponse.json(result);
}
