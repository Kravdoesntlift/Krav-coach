"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitTestimonial(
  testimonialId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (content.trim().length < 30) {
    return { error: "O testemunho deve ter pelo menos 30 caracteres." };
  }

  const { error } = await supabase
    .from("testimonials")
    .update({
      content: content.trim(),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", testimonialId)
    .eq("client_id", user.id)
    .is("submitted_at", null);

  if (error) return { error: error.message };
  revalidatePath("/client/testimonial");
  return {};
}
