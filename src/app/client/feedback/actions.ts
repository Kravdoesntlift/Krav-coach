"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function submitTrialFeedback(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const rating  = parseInt(formData.get("rating") as string);
  const content = (formData.get("content") as string)?.trim() ?? "";
  const wouldRecommend = formData.get("would_recommend") === "yes";

  if (!rating || rating < 1 || rating > 5) return { error: "missing_rating" };
  if (content.length < 10) return { error: "content_too_short" };

  const admin = createAdminClient();

  const [{ data: profile }, { data: assignment }, { data: coachRow }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).single(),
    admin.from("coach_clients").select("coach_id").eq("client_id", user.id).maybeSingle(),
    admin.from("profiles").select("id").eq("role", "coach").limit(1).maybeSingle(),
  ]);

  const coachId = assignment?.coach_id ?? coachRow?.id;
  if (!coachId) return { error: "no_coach" };

  const parts = (profile?.full_name ?? "").trim().split(" ");
  const firstName = parts[0] ?? "Anónimo";
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] + "." : "";
  const displayName = lastInitial ? `${firstName} ${lastInitial}` : firstName;

  const { error } = await admin.from("testimonials").insert({
    coach_id:         coachId,
    client_id:        user.id,
    display_name:     displayName,
    content,
    rating,
    would_recommend:  wouldRecommend,
    source:           "trial",
    submitted_at:     new Date().toISOString(),
    is_public:        false,
  });

  if (error) return { error: error.message };
  return { success: true };
}
