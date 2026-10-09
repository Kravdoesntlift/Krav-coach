"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { startProgram90 } from "@/lib/training/provision";

/**
 * Start the thirteen weeks for whoever is signed in.
 *
 * The client id comes from the session and never from the form: a client id
 * in a form field is a client id somebody else can type.
 */
export async function startProgram90Action() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const result = await startProgram90({ clientId: user.id });
  if (!result.ok) {
    console.error("[program90] could not start:", result.error);
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/client/history");
}
