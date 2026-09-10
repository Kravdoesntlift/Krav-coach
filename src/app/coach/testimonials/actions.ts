"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

export async function requestTestimonial(data: {
  client_id: string;
  display_name: string;
  result_highlight?: string | null;
  duration_weeks?: number | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  // Fetch client lang to send push in the right language
  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("lang")
    .eq("id", data.client_id)
    .single();
  const cLang: "pt" | "en" = clientProfile?.lang === "en" ? "en" : "pt";

  const { error } = await supabase.from("testimonials").insert({
    coach_id: user.id,
    client_id: data.client_id,
    display_name: data.display_name.trim(),
    result_highlight: data.result_highlight?.trim() || null,
    duration_weeks: data.duration_weeks ?? null,
    requested_at: new Date().toISOString(),
    is_public: false,
  });

  if (error) return { error: error.message };

  // Notify the client via push: await so failures appear in server logs
  const pushResult = await sendPushToUser(
    data.client_id,
    cLang === "en" ? "⭐ Your coach wants your testimonial!" : "⭐ O teu coach quer o teu testemunho!",
    cLang === "en"
      ? "Share your experience, it only takes 2 minutes."
      : "Partilha a tua experiência, só demora 2 minutos.",
    "/client/testimonial",
  );
  if (!pushResult.ok) {
    console.error("[testimonial] push failed for client", data.client_id, "-", pushResult.error);
  }

  revalidatePath("/coach/testimonials");
  return {};
}

/**
 * Copy a review from the Google Business Profile onto the site.
 *
 * Google only hands a site its own reviews through the paid Places API, so
 * they are entered by hand. The words must be the reviewer's, exactly as they
 * appear on Google: the carousel links every one of them back there, and a
 * quote that does not match what a visitor finds is worse than no quote.
 */
export async function addGoogleReview(data: {
  display_name: string;
  rating: number;
  content: string;
  date: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "coach") return { error: "Sem permissão." };

  const name = data.display_name.trim();
  if (!name) return { error: "Escreve o nome tal como aparece no Google." };
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    return { error: "Escolhe de 1 a 5 estrelas." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: "Data inválida." };

  const { error } = await supabase.from("testimonials").insert({
    coach_id: user.id,
    client_id: null,
    display_name: name,
    content: data.content.trim(),
    rating: data.rating,
    source: "google",
    // Every Google review counts toward the score on the site, bad ones
    // included. Only 4 and 5 stars reach the carousel; that filter lives in
    // the landing page query, not here.
    is_public: true,
    submitted_at: `${data.date}T12:00:00Z`,
  });

  if (error) return { error: error.message };
  revalidatePath("/coach/testimonials");
  revalidatePath("/");
  return {};
}

export async function toggleTestimonialPublic(
  id: string,
  is_public: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("testimonials")
    .update({ is_public })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/testimonials");
  return {};
}

export async function deleteTestimonial(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/testimonials");
  return {};
}
