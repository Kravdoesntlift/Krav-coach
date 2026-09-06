import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Coach-only diagnostic endpoint: shows what the cron would find
// without sending any emails. Remove this route in production when done debugging.
export async function GET(req: NextRequest) {
  void req;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const today = new Date();

  const results: Record<string, unknown> = {
    now: today.toISOString(),
    env: {
      hasCronSecret: !!process.env.CRON_SECRET,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendFrom: process.env.RESEND_FROM ?? "(using fallback: KRAV Coach <noreply@kravcoaching.com>)",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  };

  // What the trial-warning query would find today
  const trialRows: unknown[] = [];
  for (const daysLeft of [2, 1, 0]) {
    const wStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysLeft));
    const wEnd   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysLeft + 1));

    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, status, trial_ends_at, lang")
      .eq("role", "client")
      .not("status", "in", '("cancelled","past_due")')
      .not("trial_ends_at", "is", null)
      .gte("trial_ends_at", wStart.toISOString())
      .lt("trial_ends_at", wEnd.toISOString());

    trialRows.push({
      daysLeft,
      window: [wStart.toISOString(), wEnd.toISOString()],
      found: data?.length ?? 0,
      clients: data ?? [],
      queryError: error?.message ?? null,
    });
  }
  results.trialWarnings = trialRows;

  // Also list ALL clients and their trial status for reference
  const { data: allClients } = await admin
    .from("profiles")
    .select("id, full_name, status, trial_ends_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });
  results.allClients = allClients;

  return NextResponse.json(results, { status: 200 });
}
