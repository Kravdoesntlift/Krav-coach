"use server";

import { createClient } from "@/lib/supabase/server";
import { payLinkFor } from "@/lib/billing/pay-link";

/**
 * Build the payment link the coach sends to a client.
 *
 * This used to call Stripe and hand back the Checkout URL, which is four
 * lines of random characters, dies within the day, and reads like a phishing
 * attempt in a chat window. Nothing is created here: the link is signed, and
 * the Stripe session is built when the client opens it.
 */

export type PayLinkResult = { ok: true; url: string } | { ok: false; error: string };

export async function createPayLink(input: {
  clientId: string;
  amountCents: number;
}): Promise<PayLinkResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "A sessão expirou. Entra outra vez." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { ok: false, error: "Sem permissão." };

  if (!Number.isInteger(input.amountCents) || input.amountCents < 500 || input.amountCents > 100000) {
    return { ok: false, error: "Valor fora dos limites (5 a 1000 euros)." };
  }

  // The link is signed, so it would work for any id. Checking the client is
  // actually this coach's keeps a mistyped id from producing a live link to
  // somebody else's account.
  const { data: link } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", input.clientId)
    .maybeSingle();

  if (!link) return { ok: false, error: "Esse cliente não está atribuído a ti." };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kravcoaching.com";
  return { ok: true, url: payLinkFor(input.clientId, { amountCents: input.amountCents, site }) };
}
