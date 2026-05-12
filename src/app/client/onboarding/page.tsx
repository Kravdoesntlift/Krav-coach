import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already completed, redirect
  const { data: existing } = await supabase
    .from("client_onboarding")
    .select("client_id")
    .eq("client_id", user!.id)
    .maybeSingle();

  if (existing) redirect("/client/dashboard");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white">
            KRAV<span className="text-brand-gold">.</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Vamos personalizar a tua experiência</p>
        </div>
        <OnboardingForm clientId={user!.id} />
      </div>
    </div>
  );
}
