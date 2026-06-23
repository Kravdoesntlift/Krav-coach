import { createClient } from "@/lib/supabase/server";
import PhotosClient from "./PhotosClient";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const lang = await getLang();

  const extra = {
    sub: { pt: "Regista a tua transformação ao longo do tempo", en: "Track your transformation over time" },
  } as const;

  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", user!.id)
    .order("taken_at", { ascending: false });

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("progress_photos", lang)}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.sub[lang]}</p>
      </div>
      <PhotosClient clientId={user!.id} initialPhotos={photos ?? []} />
    </div>
  );
}
