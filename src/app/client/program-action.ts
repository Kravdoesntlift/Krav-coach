"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { startProgram90 } from "@/lib/training/provision";

export interface ProgramActionState {
  message: string | null;
  ok: boolean;
}

/**
 * Start the thirteen weeks for whoever is signed in.
 *
 * The client id comes from the session and never from the form: a client id
 * in a form field is a client id somebody else can type.
 *
 * It can decline, and when it does the person has to be told. Somebody whose
 * next two weeks were written by the coach would otherwise press the button
 * and watch nothing happen.
 */
export async function startProgram90Action(
  _prev: ProgramActionState,
  formData: FormData,
): Promise<ProgramActionState> {
  const isEN = formData.get("lang") === "en";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: null };

  const result = await startProgram90({ clientId: user.id });

  if (!result.ok) {
    console.error("[program90] could not start:", result.error);
    return {
      ok: false,
      message: isEN
        ? "Something went wrong on our side. Try again in a minute."
        : "Alguma coisa correu mal do nosso lado. Tenta daqui a um minuto.",
    };
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/client/history");

  if (result.started) return { ok: true, message: null };

  // The reasons are ours, in English, and belong in a log. What the person
  // reads is why it matters to them.
  const message = result.reason.includes("somebody wrote")
    ? (isEN
      ? "Your coach has already written your next weeks. The programme would overwrite them, so talk to him first and he can make room."
      : "O teu coach já escreveu as tuas próximas semanas. O programa ia escrever por cima, por isso fala com ele primeiro para abrir espaço.")
    : result.reason.includes("already following")
    ? (isEN ? "You are already following the programme." : "Já estás a seguir o programa.")
    : (isEN
      ? "The app does not write your plan, so the programme is not available on your plan."
      : "O teu plano não é escrito pela app, por isso o programa não está disponível aí.");

  return { ok: false, message };
}
