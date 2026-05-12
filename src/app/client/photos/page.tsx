import { createClient } from "@/lib/supabase/server";
import PhotosClient from "./PhotosClient";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", user!.id)
    .order("taken_at", { ascending: false });

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">Fotos de Progresso</h1>
        <p className="text-gray-400 text-sm mt-1">Regista a tua transformação ao longo do tempo</p>
      </div>
      <PhotosClient clientId={user!.id} initialPhotos={photos ?? []} />
    </div>
  );
}
