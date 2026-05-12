import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  }
  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem demasiado grande. Máximo 3MB." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure bucket exists (public, so URLs work without signed tokens)
  await admin.storage.createBucket("avatars", { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  // Remove old avatar files (different extensions)
  const { data: existing } = await admin.storage.from("avatars").list(user.id);
  if (existing?.length) {
    await admin.storage.from("avatars").remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  const { error: storageErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (storageErr) {
    return NextResponse.json({ error: storageErr.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
