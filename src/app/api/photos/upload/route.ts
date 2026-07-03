import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { detectImageMime } from "@/lib/file-magic";

export async function POST(req: NextRequest) {
  // Verify user session
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string | null)?.trim() || null;
  const angle = (formData.get("angle") as string | null) || null;

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

  if (!file) {
    return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "Tipo de ficheiro não permitido. Usa JPEG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Ficheiro demasiado grande. Máximo 15MB." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure bucket exists and is public — both calls are idempotent
  await admin.storage.createBucket("progress-photos", { public: true }).catch(() => {});
  await admin.storage.updateBucket("progress-photos", { public: true }).catch(() => {});

  const path = `${user.id}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  // Verify magic bytes to prevent MIME-type spoofing
  const detectedMime = detectImageMime(new Uint8Array(bytes));
  if (!detectedMime) {
    return NextResponse.json({ error: "Ficheiro inválido. Usa JPEG, PNG ou WebP." }, { status: 400 });
  }

  const { error: storageErr } = await admin.storage
    .from("progress-photos")
    .upload(path, bytes, {
      contentType: detectedMime,
      upsert: false,
    });

  if (storageErr) {
    return NextResponse.json({ error: storageErr.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("progress-photos").getPublicUrl(path);

  const today = new Date();
  const taken_at = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: photo, error: dbErr } = await admin
    .from("progress_photos")
    .insert({
      client_id: user.id,
      photo_url: urlData.publicUrl,
      caption,
      taken_at,
      ...(angle ? { angle } : {}),
    })
    .select()
    .single();

  if (dbErr) {
    // Storage succeeded but DB failed — clean up orphan file
    await admin.storage.from("progress-photos").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Notify the client's coach(es)
  const { data: clientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: plans } = await admin
    .from("workout_plans")
    .select("coach_id")
    .eq("client_id", user.id);

  const coachIds = [...new Set((plans ?? []).map((p) => p.coach_id))];
  const clientName = clientProfile?.full_name ?? "O teu cliente";

  if (coachIds.length === 0) {
    console.log("[push] No coaches found for client", user.id);
  } else {
    await Promise.all(
      coachIds.map((coachId) =>
        sendPushToUser(
          coachId,
          "📸 Nova foto de progresso",
          `${clientName} adicionou uma nova foto de progresso.`,
          `/coach/clients/${user.id}`,
        ).catch((e: unknown) => console.error("[push] photo notify failed:", e))
      )
    );
  }

  return NextResponse.json({ photo });
}
