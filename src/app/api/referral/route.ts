import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateCode(): string {
  return require("crypto").randomBytes(6).toString("hex").toUpperCase();
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createAdminClient();

  // Check if code exists
  const { data: existing } = await admin
    .from("referral_codes")
    .select("*")
    .eq("client_id", user.id)
    .maybeSingle();

  if (existing) {
    const { data: referrals } = await admin
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ code: existing, referrals: referrals ?? [] });
  }

  // Generate a new code
  const code = generateCode();
  const { data: created, error } = await admin
    .from("referral_codes")
    .insert({ client_id: user.id, code })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ code: created, referrals: [] });
}
