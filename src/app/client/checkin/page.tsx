import { createClient } from "@/lib/supabase/server";
import CheckinForm from "@/components/client/CheckinForm";
import CheckinHistory from "@/components/client/CheckinHistory";
import WeightChart from "@/components/client/WeightChart";
import MeasurementCharts from "@/components/client/MeasurementCharts";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/getLang";

const extra = {
  week_of: { pt: "Semana de", en: "Week of" },
} as const;

export default async function CheckinPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const { data: { user } } = await supabase.auth.getUser();

  // Current week start (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const [{ data: existing }, { data: history }] = await Promise.all([
    supabase
      .from("weekly_checkins")
      .select("*")
      .eq("client_id", user!.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("weekly_checkins")
      .select("*")
      .eq("client_id", user!.id)
      .lt("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="space-y-10">
      {/* Current week check-in */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t("weekly_checkin", lang)}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {extra.week_of[lang]}{" "}
            {new Date(weekStart + "T00:00:00").toLocaleDateString(
              lang === "en" ? "en-GB" : "pt-PT",
              { day: "numeric", month: "long" }
            )}
          </p>
        </div>
        <CheckinForm clientId={user!.id} weekStart={weekStart} existing={existing} />
      </div>

      {/* Weight chart */}
      {history && history.length >= 2 && (
        <WeightChart checkins={history} />
      )}

      {/* Measurement charts */}
      {history && history.length >= 2 && (
        <MeasurementCharts checkins={history} />
      )}

      {/* History */}
      {history && history.length > 0 && (
        <CheckinHistory checkins={history} />
      )}
    </div>
  );
}
