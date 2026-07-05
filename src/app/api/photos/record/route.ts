import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { path, angle, caption } = await req.json() as {
    path?: string; angle?: string; caption?: string;
  };
  if (!path) return NextResponse.json({ error: "path em falta" }, { status: 400 });

  const admin = createAdminClient();
  const { data: urlData } = admin.storage.from("progress-photos").getPublicUrl(path);

  const today = new Date();
  const taken_at = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: photo, error: dbErr } = await admin
    .from("progress_photos")
    .insert({
      client_id: user.id,
      photo_url: urlData.publicUrl,
      caption: caption?.trim() || null,
      taken_at,
      ...(angle ? { angle } : {}),
    })
    .select()
    .single();

  if (dbErr) {
    await admin.storage.from("progress-photos").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Notify coach(es)
  const { data: clientProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const { data: plans } = await admin.from("workout_plans").select("coach_id").eq("client_id", user.id);
  const coachIds = [...new Set((plans ?? []).map((p: { coach_id: string }) => p.coach_id))];
  const clientName = clientProfile?.full_name ?? "O teu cliente";

  await Promise.all(
    coachIds.map((coachId) =>
      sendPushToUser(coachId, "📸 Nova foto de progresso", `${clientName} adicionou uma nova foto.`, `/coach/clients/${user.id}`)
        .catch(() => {})
    )
  );

  return NextResponse.json({ photo });
}
