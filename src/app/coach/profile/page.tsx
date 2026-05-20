import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import PushDebugPanel from "@/components/PushDebugPanel";
import PublicLinkCard from "@/components/coach/PublicLinkCard";
import TransformationUpload from "@/components/coach/TransformationUpload";

export default async function CoachProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="page-enter max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-gray-400 text-sm mt-1">Gere as tuas informações</p>
      </div>

      <div className="card p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-white text-sm font-semibold">Notificações push</p>
          <p className="text-gray-500 text-xs mt-0.5">Recebe alertas quando clientes adicionam fotos ou fazem check-in</p>
        </div>
        <PushNotificationToggle />
      </div>

      <div className="mb-6">
        <PublicLinkCard coachId={user!.id} />
      </div>

      <ProfileForm profile={profile} email={user!.email ?? ""} />

      {profile?.role === "coach" && (
        <div className="mt-6 card p-5">
          <TransformationUpload
            currentBeforeUrl={profile.transformation_before_url ?? null}
            currentAfterUrl={profile.transformation_after_url ?? null}
          />
        </div>
      )}

      <div className="mt-6">
        <PushDebugPanel />
      </div>
    </div>
  );
}
