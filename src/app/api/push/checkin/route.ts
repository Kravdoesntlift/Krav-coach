import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

// POST /api/push/checkin
// Called by CheckinForm after a successful check-in to notify the coach.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart } = await req.json().catch(() => ({}));

  const admin = createAdminClient();

  // Find coach via coach_clients
  const { data: assignment } = await admin
    .from("coach_clients")
    .select("coach_id")
    .eq("client_id", user.id)
    .eq("assigned_role", "coach")
    .maybeSingle();

  if (!assignment?.coach_id) {
    return NextResponse.json({ ok: false, error: "No coach assigned" });
  }

  const { data: clientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const clientFirst = (clientProfile?.full_name ?? "").split(" ")[0] || "Um cliente";
  const week = weekStart
    ? new Date(weekStart + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
    : "esta semana";

  const result = await sendPushToUser(
    assignment.coach_id,
    "📋 Novo check-in recebido!",
    `${clientFirst} submeteu o check-in de ${week}.`,
    `/coach/clients/${user.id}`,
  );

  return NextResponse.json(result);
}
