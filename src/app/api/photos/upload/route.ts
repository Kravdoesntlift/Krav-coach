import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

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

  if (!file) {
    return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure bucket exists (idempotent)
  await admin.storage.createBucket("progress-photos", { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageErr } = await admin.storage
    .from("progress-photos")
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
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

  const notifResults = await Promise.all(
    coachIds.map((coachId) =>
      sendPushToUser(
        coachId,
        "📸 Nova foto de progresso",
        `${clientName} adicionou uma nova foto de progresso.`,
        `/coach/clients/${user.id}`,
      )
    )
  );

  // Log for server-side debugging
  if (coachIds.length === 0) {
    console.log("[push] No coaches found for client", user.id);
  } else {
    console.log("[push] Notification results:", JSON.stringify({ coachIds, notifResults }));
  }

  return NextResponse.json({ photo, _debug: { coachIds, notifResults } });
}
