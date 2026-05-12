import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="page-enter space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Perfil</h1>
          <p className="text-gray-400 text-sm mt-1">Gere as tuas informações</p>
        </div>
        <PushNotificationToggle />
      </div>
      <ProfileForm profile={profile} email={user!.email ?? ""} />
    </div>
  );
}
