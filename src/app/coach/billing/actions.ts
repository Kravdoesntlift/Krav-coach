"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reconcileBilling } from "@/lib/billing/reconcile";

export interface SyncResult {
  ok: boolean;
  message: string;
}

/**
 * Run the billing reconciliation from the coach's own page.
 *
 * The cron endpoint needs either the CRON_SECRET or a session cookie the
 * browser does not always carry to a raw /api URL, which is a confusing way to
 * be told "Unauthorized" when you are in fact logged in. A server action runs
 * inside the page's own auth context, so if the coach can see the page they can
 * run the sync.
 */
export async function syncBillingAction(): Promise<SyncResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada. Volta a entrar." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "coach") {
    return { ok: false, message: "Apenas o coach pode sincronizar a faturação." };
  }

  const result = await reconcileBilling();

  if ("error" in result) {
    return { ok: false, message: "Stripe não está configurado neste ambiente." };
  }

  if (result.errors.length) {
    return { ok: false, message: `Sincronizado com erros: ${result.errors[0]}` };
  }

  revalidatePath("/coach/billing");
  revalidatePath("/coach/dashboard");

  const plural = result.scanned === 1 ? "subscrição" : "subscrições";
  if (result.repaired === 0) {
    return { ok: true, message: `Tudo certo — ${result.scanned} ${plural} já estavam em dia.` };
  }
  return {
    ok: true,
    message: `${result.repaired} de ${result.scanned} ${plural} corrigidas.`,
  };
}
