import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Which Node the production runtime is actually on.
 *
 * Added on 2026-10-23, when Stripe wrote to say its telemetry saw this
 * account calling the API from an unpatched Node (the October 2026 Brotli
 * out-of-bounds write, CVE-2026-111497). The version is chosen by Vercel and
 * patched by Vercel, so the only honest way to answer "are we patched" is to
 * ask the running process rather than read a dashboard or assume.
 *
 * Behind CRON_SECRET, because the Node version of a live server is free
 * reconnaissance for anybody collecting targets for the next advisory.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // An unset $CRON_SECRET in someone's shell sends a literally empty bearer;
  // never let that match a missing server-side secret.
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      region: process.env.VERCEL_REGION ?? null,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      deployedAt: process.env.VERCEL_DEPLOYMENT_ID ? null : "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
