import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const ext = (req.nextUrl.searchParams.get("ext") ?? "jpg").toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Extensão não permitida" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.storage.createBucket("progress-photos", { public: true }).catch(() => {});
  await admin.storage.updateBucket("progress-photos", { public: true }).catch(() => {});

  const path = `${user.id}/${Date.now()}.${ext}`;
  const { data, error: signErr } = await admin.storage
    .from("progress-photos")
    .createSignedUploadUrl(path);

  if (signErr || !data) {
    return NextResponse.json({ error: signErr?.message ?? "Erro ao criar URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path, token: data.token });
}
