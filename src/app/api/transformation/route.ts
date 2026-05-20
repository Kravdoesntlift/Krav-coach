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
  const slot = formData.get("slot") as "before" | "after" | null;

  if (!file) return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  if (slot !== "before" && slot !== "after") return NextResponse.json({ error: "Slot inválido" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Imagem demasiado grande. Máximo 5MB." }, { status: 400 });

  const admin = createAdminClient();
  await admin.storage.createBucket("avatars", { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/transformation_${slot}.${ext}`;
  const bytes = await file.arrayBuffer();

  // Remove old file for this slot
  const { data: existing } = await admin.storage.from("avatars").list(user.id);
  const old = existing?.find((f) => f.name.startsWith(`transformation_${slot}`));
  if (old) await admin.storage.from("avatars").remove([`${user.id}/${old.name}`]);

  const { error: storageErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const column = slot === "before" ? "transformation_before_url" : "transformation_after_url";
  const { error: dbErr } = await admin.from("profiles").update({ [column]: publicUrl }).eq("id", user.id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}
