import { createClient } from "@/lib/supabase/server";
import LeadsClient from "./LeadsClient";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const total = leads?.length ?? 0;
  const newCount = leads?.filter((l) => (l.status ?? "new") === "new").length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {total} {total === 1 ? "pessoa pediu" : "pessoas pediram"} o guia gratuito
          {newCount > 0 && (
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa" }}>
              {newCount} por contactar
            </span>
          )}
        </p>
      </div>

      <LeadsClient leads={(leads ?? []) as any} />
    </div>
  );
}
