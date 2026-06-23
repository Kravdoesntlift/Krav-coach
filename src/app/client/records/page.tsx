import { createClient } from "@/lib/supabase/server";
import PersonalRecords from "@/components/client/PersonalRecords";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

const extra = {
  best_results: { pt: "Os teus melhores resultados", en: "Your best results" },
} as const;

export default async function RecordsPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: records } = await supabase
    .from("personal_records")
    .select("*")
    .eq("client_id", user!.id)
    .order("recorded_at", { ascending: false });

  return (
    <div className="page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t("personal_records", lang)}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.best_results[lang]}</p>
      </div>
      <PersonalRecords clientId={user!.id} initialRecords={records ?? []} />
    </div>
  );
}
