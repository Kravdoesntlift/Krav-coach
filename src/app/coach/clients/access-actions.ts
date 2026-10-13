"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Free access, granted and withdrawn by the coach.
 *
 * This used to need somebody with database access, which meant it needed me,
 * and the first attempt was quietly undone by the nightly billing job the same
 * night. The date lives in `trial_ends_at`, which is what the paywall reads,
 * what decides whether the app writes their plans, and what the sync now
 * refuses to overwrite.
 *
 * Deliberately not touching Stripe: nobody is being charged and no invoice
 * exists, so inventing a subscription would put money into the reports that
 * never arrived.
 */

export interface AccessActionState {
  message: string | null;
  ok: boolean;
}

const MONTHS: Record<string, number> = { "1": 1, "3": 3, "12": 12 };

export async function setClientAccessAction(
  _prev: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  const clientId = String(formData.get("clientId") ?? "");
  const choice = String(formData.get("choice") ?? "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada. Entra outra vez." };

  // The coach, and this coach's client. Both checked server side: a client id
  // in a form field is a client id anybody can type.
  const [{ data: me }, { data: rel }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("coach_clients")
      .select("id")
      .eq("coach_id", user.id)
      .eq("client_id", clientId)
      .maybeSingle(),
  ]);
  if (me?.role !== "coach" || !rel) return { ok: false, message: "Não tens acesso a este cliente." };

  const admin = createAdminClient();

  // Somebody paying already has access, and the sync clears this field for
  // live subscriptions anyway: writing it would look like it worked and do
  // nothing.
  const { data: live } = await admin
    .from("stripe_subscriptions")
    .select("id")
    .eq("client_id", clientId)
    .in("status", ["active", "trialing"])
    .limit(1);
  if (live && live.length > 0) {
    return { ok: false, message: "Este cliente tem subscrição ativa, já tem acesso." };
  }

  if (choice === "end") {
    // Expired, not deleted: they still show up as a trial that ended, which
    // is exactly the conversation worth having.
    await admin
      .from("profiles")
      .update({ trial_ends_at: new Date().toISOString() })
      .eq("id", clientId);
    revalidatePath(`/coach/clients/${clientId}`);
    revalidatePath("/coach/dashboard");
    return { ok: true, message: "Acesso terminado." };
  }

  const months = MONTHS[choice];
  if (!months) return { ok: false, message: "Duração inválida." };

  const { data: profile } = await admin
    .from("profiles")
    .select("trial_ends_at")
    .eq("id", clientId)
    .maybeSingle();

  // Extending never shortens: count from whichever is later, today or the
  // date they already have.
  const current = profile?.trial_ends_at ? new Date(profile.trial_ends_at as string) : null;
  const base = current && current.getTime() > Date.now() ? current : new Date();
  const until = new Date(base);
  until.setUTCMonth(until.getUTCMonth() + months);

  const { error } = await admin
    .from("profiles")
    .update({ status: "active", trial_ends_at: until.toISOString() })
    .eq("id", clientId);

  if (error) {
    console.error("[access] could not grant:", error.message);
    return { ok: false, message: "Não consegui gravar. Tenta outra vez." };
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/dashboard");
  return {
    ok: true,
    message: `Acesso até ${until.toISOString().slice(0, 10)}.`,
  };
}
