import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Temporary debug route — remove after diagnosing photos issue
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not authed" }, { status: 401 });

  const admin = createAdminClient();

  const clientId = req.nextUrl.searchParams.get("clientId");

  const [{ data: photos, error: photosErr }, { data: buckets, error: bucketsErr }, { data: files, error: filesErr }] = await Promise.all([
    admin.from("progress_photos").select("*").eq("client_id", clientId ?? user.id).limit(20),
    admin.storage.listBuckets(),
    admin.storage.from("progress-photos").list(clientId ?? user.id, { limit: 20 }),
  ]);

  return NextResponse.json({
    db_rows: photos ?? [],
    db_error: photosErr?.message ?? null,
    buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) ?? [],
    buckets_error: bucketsErr?.message ?? null,
    storage_files: files ?? [],
    storage_error: filesErr?.message ?? null,
  });
}
