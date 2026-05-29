import { createClient } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-gray-400 text-sm mt-1">
          Pessoas que pediram o guia gratuito — {leads?.length ?? 0} no total
        </p>
      </div>

      {!leads?.length ? (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-8 text-center">
          <p className="text-zinc-500 text-sm">Ainda não há leads. Partilha o link <span className="text-brand-gold font-semibold">kravcoaching.com/guia</span> nas redes.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800" style={{ background: "#111" }}>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest uppercase text-zinc-500">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest uppercase text-zinc-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold tracking-widest uppercase text-zinc-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="border-b border-zinc-800 last:border-0 hover:bg-zinc-900 transition-colors"
                  style={{ background: i % 2 === 0 ? "#0d0d0d" : "#0a0a0a" }}
                >
                  <td className="px-4 py-3 text-white font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    <a href={`mailto:${lead.email}`} className="hover:text-brand-gold transition-colors">
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">
                    {new Date(lead.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
