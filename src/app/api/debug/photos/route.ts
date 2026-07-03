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
  const clientId = req.nextUrl.searchParams.get("clientId") ?? user.id;

  // 1. DB rows
  const { data: photos, error: photosErr } = await admin
    .from("progress_photos").select("*").eq("client_id", clientId).limit(20);

  // 2. Buckets
  const { data: buckets, error: bucketsErr } = await admin.storage.listBuckets();

  // 3. Storage files
  const { data: files, error: filesErr } = await admin.storage
    .from("progress-photos").list(clientId, { limit: 20 });

  // 4. Test upload: write a tiny 1x1 JPEG to storage to confirm write permissions work
  const tinyJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC" +
    "AABAAEDASIA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAU" +
    "AQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwAB/9k=",
    "base64"
  );
  const testPath = `${clientId}/_debug_test_${Date.now()}.jpg`;
  const { error: uploadErr } = await admin.storage
    .from("progress-photos")
    .upload(testPath, tinyJpeg, { contentType: "image/jpeg", upsert: true });

  // Clean up test file
  if (!uploadErr) await admin.storage.from("progress-photos").remove([testPath]);

  // 5. Check if progress_photos table exists
  const { error: tableErr } = await admin
    .from("progress_photos").select("id").limit(1);

  return NextResponse.json({
    authenticated_as: user.id,
    queried_client: clientId,
    db_rows: photos ?? [],
    db_error: photosErr?.message ?? null,
    table_exists: !tableErr,
    table_error: tableErr?.message ?? null,
    buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) ?? [],
    buckets_error: bucketsErr?.message ?? null,
    storage_files: files ?? [],
    storage_error: filesErr?.message ?? null,
    upload_test: uploadErr ? `FAIL: ${uploadErr.message}` : "OK — storage write works",
  });
}
