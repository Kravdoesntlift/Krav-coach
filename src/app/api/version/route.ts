import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * What is actually running in production.
 *
 * Every deploy in this project has been verified by guessing: polling a bundle
 * hash that does not change when only server code changed, or reloading a page
 * that the router had cached. Both have been wrong, in opposite directions, on
 * the same day. This answers the question directly.
 *
 * Public on purpose, and deliberately boring: a commit sha, the branch and the
 * build time are already visible to anyone reading the repository.
 */
export function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    shortSha: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    environment: process.env.VERCEL_ENV ?? "development",
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ? new Date().toISOString() : null,
  });
}
