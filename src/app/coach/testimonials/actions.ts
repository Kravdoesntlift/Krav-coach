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

  // Notify the client via push
  sendPushToUser(
    data.client_id,
    cLang === "en" ? "⭐ Your coach wants your testimonial!" : "⭐ O teu coach quer o teu testemunho!",
    cLang === "en"
      ? "Share your experience — it only takes 2 minutes."
      : "Partilha a tua experiência — só demora 2 minutos.",
    "/client/testimonial",
  ).catch((err) => console.error("[testimonial] push failed:", err));

  revalidatePath("/coach/testimonials");
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
