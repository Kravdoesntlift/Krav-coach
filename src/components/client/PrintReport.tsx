"use client";

import { useLang } from "@/lib/i18n/useLang";

interface Checkin {
  week_start: string;
  weight_kg: number | null;
  energy_level: number | null;
  notes: string | null;
}

interface PR {
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  recorded_at: string;
}

interface Props {
  clientName: string;
  month: string;
  year: number;
  totalWorkouts: number;
  totalPlannedDays: number;
  totalPRs: number;
  weightChange: number | null;
  avgEnergy: number | null;
  adherence: number | null;
  checkins: Checkin[];
  topExercises: { name: string; sets: number }[];
  prs: PR[];
  totalVolumeKg: number;
}

const ENERGY_LABELS_PT: Record<number, string> = { 1: "Mínima", 2: "Baixa", 3: "Normal", 4: "Alta", 5: "Máxima" };
const ENERGY_LABELS_EN: Record<number, string> = { 1: "Minimal", 2: "Low", 3: "Normal", 4: "High", 5: "Maximum" };

export default function PrintReport(props: Props) {
  const { clientName, month, year, totalWorkouts, totalPlannedDays, totalPRs, weightChange, avgEnergy, adherence, checkins, topExercises, prs, totalVolumeKg } = props;
  const { lang } = useLang();
  const isEN = lang === "en";
  const locale = isEN ? "en-GB" : "pt-PT";
  const ENERGY_LABELS = isEN ? ENERGY_LABELS_EN : ENERGY_LABELS_PT;

  const totalVolumeTons = totalVolumeKg >= 1000 ? `${(totalVolumeKg / 1000).toFixed(1)}t` : totalVolumeKg > 0 ? `${totalVolumeKg} kg` : null;

  return (
    <>
      {/* Screen view */}
      <div className="no-print space-y-6 page-enter">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{isEN ? "Monthly Report" : "Relatório Mensal"}</h1>
            <p className="text-gray-400 text-sm mt-1">{month} {year}</p>
          </div>
          <button onClick={() => window.print()} className="btn-primary text-sm flex items-center gap-2">
            <span>⬇</span> {isEN ? "Download PDF" : "Descarregar PDF"}
          </button>
        </div>
        <p className="text-gray-500 text-xs">
          {isEN
            ? 'The report is formatted for print/PDF when you click "Download".'
            : 'O relatório é formatado para impressão/PDF ao clicar em "Descarregar".'}
        </p>
      </div>

      {/* Printable report */}
      <div className="report-wrap">
        {/* Cover strip */}
        <div className="report-cover">
          <div className="report-cover-left">
            <p className="report-brand">KRAV<span className="report-dot">.</span></p>
            <p className="report-cover-label">{isEN ? "Progress Report" : "Relatório de Progresso"}</p>
          </div>
          <div className="report-cover-right">
            <p className="report-client-name">{clientName}</p>
            <p className="report-cover-period">{month} {year}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <p className="stat-num" style={{ color: "#C9A84C" }}>{totalWorkouts}</p>
            <p className="stat-label">{isEN ? "Workouts" : "Treinos"}</p>
            {adherence !== null && <p className="stat-sub">{totalWorkouts}/{totalPlannedDays} {isEN ? "planned" : "planeados"}</p>}
          </div>
          <div className="stat-card">
            <p className="stat-num" style={{ color: adherence && adherence >= 80 ? "#4ade80" : adherence && adherence >= 50 ? "#C9A84C" : "#f87171" }}>
              {adherence !== null ? `${adherence}%` : "-"}
            </p>
            <p className="stat-label">{isEN ? "Adherence" : "Adesão"}</p>
            <p className="stat-sub">{isEN ? "to plan" : "ao plano"}</p>
          </div>
          <div className="stat-card">
            <p className="stat-num" style={{ color: weightChange === null ? "#888" : weightChange < 0 ? "#4ade80" : weightChange > 0 ? "#f87171" : "#888" }}>
              {weightChange === null ? "-" : `${weightChange > 0 ? "+" : ""}${weightChange} kg`}
            </p>
            <p className="stat-label">{isEN ? "Weight" : "Peso"}</p>
            <p className="stat-sub">{checkins.length} check-ins</p>
          </div>
          <div className="stat-card">
            <p className="stat-num" style={{ color: "#C9A84C" }}>{totalPRs > 0 ? totalPRs : "-"}</p>
            <p className="stat-label">{isEN ? "Records" : "Recordes"}</p>
            <p className="stat-sub">{isEN ? "personal" : "pessoais"}</p>
          </div>
          {totalVolumeTons && (
            <div className="stat-card">
              <p className="stat-num" style={{ color: "#C9A84C" }}>{totalVolumeTons}</p>
              <p className="stat-label">{isEN ? "Volume" : "Volume"}</p>
              <p className="stat-sub">{isEN ? "lifted" : "levantado"}</p>
            </div>
          )}
          {avgEnergy !== null && (
            <div className="stat-card">
              <p className="stat-num" style={{ color: "#C9A84C" }}>{avgEnergy}<span style={{ fontSize: "14px", color: "#888" }}>/5</span></p>
              <p className="stat-label">{isEN ? "Energy" : "Energia"}</p>
              <p className="stat-sub">{isEN ? "average" : "média"}</p>
            </div>
          )}
        </div>

        {/* Weight chart */}
        {checkins.filter(c => c.weight_kg).length >= 2 && (
          <section className="report-section">
            <h2 className="section-title">{isEN ? "Weight Evolution" : "Evolução do Peso"}</h2>
            <WeightMiniChart checkins={checkins} locale={locale} />
          </section>
        )}

        {/* Top exercises */}
        {topExercises.length > 0 && (
          <section className="report-section">
            <h2 className="section-title">{isEN ? "Most practised exercises" : "Exercícios mais praticados"}</h2>
            <div className="exercises-list">
              {topExercises.map((e, i) => {
                const maxSets = topExercises[0].sets;
                const pct = Math.round((e.sets / maxSets) * 100);
                return (
                  <div key={e.name} className="exercise-row">
                    <span className="ex-rank">{i + 1}</span>
                    <div className="ex-main">
                      <div className="ex-name-row">
                        <span className="ex-name">{e.name}</span>
                        <span className="ex-sets">{e.sets} {isEN ? "sets" : "séries"}</span>
                      </div>
                      <div className="ex-bar-bg">
                        <div className="ex-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Checkin table */}
        {checkins.length > 0 && (
          <section className="report-section">
            <h2 className="section-title">{isEN ? "Weekly Check-ins" : "Check-ins Semanais"}</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>{isEN ? "Week" : "Semana"}</th>
                  <th>{isEN ? "Weight" : "Peso"}</th>
                  <th>{isEN ? "Energy" : "Energia"}</th>
                  <th>{isEN ? "Measures" : "Medidas"}</th>
                  <th>{isEN ? "Notes" : "Notas"}</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.week_start}>
                    <td>{new Date(c.week_start + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}</td>
                    <td className="td-bold">{c.weight_kg ? `${c.weight_kg} kg` : "-"}</td>
                    <td>{c.energy_level ? `${c.energy_level}/5 · ${ENERGY_LABELS[c.energy_level]}` : "-"}</td>
                    <td>
                      {[(c as unknown as Record<string, unknown>).waist_cm ? `${isEN ? "W" : "C"}: ${(c as unknown as Record<string, unknown>).waist_cm}cm` : null, (c as unknown as Record<string, unknown>).chest_cm ? `${isEN ? "Ch" : "P"}: ${(c as unknown as Record<string, unknown>).chest_cm}cm` : null, (c as unknown as Record<string, unknown>).arm_cm ? `${isEN ? "A" : "B"}: ${(c as unknown as Record<string, unknown>).arm_cm}cm` : null].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td className="td-notes">{c.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* PRs */}
        {prs.length > 0 && (
          <section className="report-section">
            <h2 className="section-title">{isEN ? "New Personal Records" : "Novos Recordes Pessoais"}</h2>
            <div className="prs-grid">
              {prs.map((pr) => (
                <div key={pr.exercise_name + pr.recorded_at} className="pr-card">
                  <p className="pr-exercise">{pr.exercise_name}</p>
                  <p className="pr-value">{pr.weight_kg ? `${pr.weight_kg} kg` : "-"}{pr.reps ? <span className="pr-reps"> × {pr.reps}</span> : ""}</p>
                  <p className="pr-date">{new Date(pr.recorded_at + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="report-footer">
          <div className="footer-brand">KRAV<span style={{ color: "#C9A84C" }}>.</span></div>
          <p className="footer-text">
            {isEN ? "Generated on " : "Gerado a "}
            {new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .report-wrap {
          font-family: 'Helvetica Neue', system-ui, sans-serif;
          max-width: 760px;
          margin: 24px auto 0;
          background: #fff;
          color: #111;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e5e5e5;
        }

        /* Cover */
        .report-cover {
          background: #0a0a0a;
          padding: 32px 36px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .report-brand { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #fff; margin: 0 0 4px; }
        .report-dot { color: #C9A84C; }
        .report-cover-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin: 0; }
        .report-cover-right { text-align: right; }
        .report-client-name { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 4px; }
        .report-cover-period { font-size: 13px; color: #C9A84C; font-weight: 600; margin: 0; }

        /* Stats */
        .stats-row {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .stat-card {
          flex: 1;
          padding: 20px 16px;
          text-align: center;
          border-right: 1px solid #f0f0f0;
        }
        .stat-card:last-child { border-right: none; }
        .stat-num { font-size: 26px; font-weight: 900; line-height: 1; margin: 0 0 4px; }
        .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin: 0 0 2px; }
        .stat-sub { font-size: 10px; color: #bbb; margin: 0; }

        /* Sections */
        .report-section { padding: 24px 36px; border-bottom: 1px solid #f5f5f5; }
        .section-title {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: #C9A84C;
          margin: 0 0 16px;
        }

        /* Exercise bars */
        .exercises-list { display: flex; flex-direction: column; gap: 10px; }
        .exercise-row { display: flex; align-items: center; gap: 12px; }
        .ex-rank { font-size: 11px; color: #C9A84C; font-weight: 700; width: 14px; text-align: right; shrink: 0; }
        .ex-main { flex: 1; }
        .ex-name-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .ex-name { font-size: 13px; font-weight: 500; color: #222; }
        .ex-sets { font-size: 12px; color: #C9A84C; font-weight: 600; }
        .ex-bar-bg { height: 4px; background: #f0f0f0; border-radius: 2px; }
        .ex-bar-fill { height: 4px; background: #C9A84C; border-radius: 2px; }

        /* Table */
        .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .report-table th { text-align: left; padding: 0 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 1px solid #eee; }
        .report-table td { padding: 10px 8px; border-bottom: 1px solid #f8f8f8; vertical-align: top; color: #333; }
        .report-table tr:last-child td { border-bottom: none; }
        .td-bold { font-weight: 600; }
        .td-notes { color: #999; font-size: 11px; max-width: 160px; }

        /* Weight chart */
        .weight-chart { width: 100%; height: 80px; }

        /* PRs grid */
        .prs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .pr-card { background: #fafafa; border-radius: 10px; padding: 12px; }
        .pr-exercise { font-size: 11px; color: #888; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pr-value { font-size: 18px; font-weight: 900; color: #111; margin: 0 0 2px; }
        .pr-reps { font-size: 12px; font-weight: 400; color: #999; }
        .pr-date { font-size: 10px; color: #C9A84C; font-weight: 600; margin: 0; }

        /* Footer */
        .report-footer { padding: 20px 36px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
        .footer-brand { font-size: 18px; font-weight: 900; color: #0a0a0a; letter-spacing: -0.5px; }
        .footer-text { font-size: 11px; color: #bbb; margin: 0; }
      `}</style>
    </>
  );
}

function WeightMiniChart({ checkins, locale }: { checkins: { week_start: string; weight_kg: number | null }[]; locale: string }) {
  const pts = checkins.filter(c => c.weight_kg).map(c => ({ date: c.week_start, w: c.weight_kg! }));
  if (pts.length < 2) return null;

  const minW = Math.min(...pts.map(p => p.w)) - 1;
  const maxW = Math.max(...pts.map(p => p.w)) + 1;
  const W = 700, H = 80;
  const xScale = (i: number) => (i / (pts.length - 1)) * (W - 40) + 20;
  const yScale = (w: number) => H - 10 - ((w - minW) / (maxW - minW)) * (H - 20);

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.w)}`).join(" ");
  const area = `${path} L ${xScale(pts.length - 1)} ${H} L ${xScale(0)} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="weight-chart">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wg)" />
      <path d={path} fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(p.w)} r="3" fill="#C9A84C" />
          <text x={xScale(i)} y={H} textAnchor="middle" fontSize="9" fill="#bbb">
            {new Date(p.date + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "numeric" })}
          </text>
        </g>
      ))}
    </svg>
  );
}
