import { createClient } from "@/lib/supabase/server";
import PersonalRecords from "@/components/client/PersonalRecords";

export default async function RecordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: records } = await supabase
    .from("personal_records")
    .select("*")
    .eq("client_id", user!.id)
    .order("recorded_at", { ascending: false });

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Recordes Pessoais</h1>
        <p className="text-gray-400 text-sm mt-1">Os teus melhores resultados</p>
      </div>
      <PersonalRecords clientId={user!.id} initialRecords={records ?? []} />
    </div>
  );
}
