"use client";

import { useState, useCallback } from "react";
import {
  Document, Page, Text, View, StyleSheet, pdf,
} from "@react-pdf/renderer";

// ── PDF Styles ───────────────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const DARK = "#111111";
const ZINC = "#71717A";

const s = StyleSheet.create({
  page:         { backgroundColor: "#FFFFFF", padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: GOLD },
  logoText:     { fontSize: 22, fontWeight: "bold", color: DARK, letterSpacing: -0.5 },
  logoDot:      { color: GOLD },
  headerRight:  { alignItems: "flex-end" },
  headerTitle:  { fontSize: 14, fontWeight: "bold", color: DARK },
  headerSub:    { fontSize: 9, color: ZINC, marginTop: 2 },
  section:      { marginBottom: 22 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: DARK, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  statsRow:     { flexDirection: "row", gap: 12, marginBottom: 8 },
  statBox:      { flex: 1, backgroundColor: "#F9F9F9", borderRadius: 8, padding: 12, alignItems: "center" },
  statValue:    { fontSize: 20, fontWeight: "bold", color: DARK },
  statGold:     { fontSize: 20, fontWeight: "bold", color: GOLD },
  statLabel:    { fontSize: 8, color: ZINC, marginTop: 3, textAlign: "center" },
  row:          { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  rowLabel:     { color: DARK, flex: 1 },
  rowValue:     { color: ZINC, fontWeight: "bold" },
  rowGold:      { color: GOLD, fontWeight: "bold" },
  noteBox:      { backgroundColor: "#FAFAFA", borderRadius: 6, padding: 10, marginBottom: 8 },
  noteWeek:     { fontSize: 8, color: ZINC, marginBottom: 3, fontWeight: "bold" },
  noteText:     { color: DARK, lineHeight: 1.5 },
  footer:       { position: "absolute", bottom: 28, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 10 },
  footerText:   { fontSize: 8, color: ZINC },
  tag:          { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  tagGreen:     { backgroundColor: "#DCFCE7", color: "#16A34A" },
  tagRed:       { backgroundColor: "#FEE2E2", color: "#DC2626" },
});

// ── PDF Document ─────────────────────────────────────────────────────────────
interface ReportData {
  clientName: string;
  monthLabel: string;
  month: string | null;
  trainings: number;
  checkins: number;
  firstWeight: number | null;
  lastWeight: number | null;
  weightDelta: number | null;
  avgEnergy: number | null;
  prs: { exercise_name: string; weight_kg: number | null; reps: number | null; achieved_at: string }[];
  notes: { week: string; note: string }[];
}

function ReportDocument({ data }: { data: ReportData }) {
  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short" });

  return (
    <Document title={`Relatório KRAV · ${data.monthLabel}`} author="KRAV Coaching">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logoText}>KRAV<Text style={s.logoDot}>.</Text></Text>
            <Text style={{ fontSize: 8, color: ZINC, marginTop: 2 }}>Premium Coaching</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>Relatório Mensal</Text>
            <Text style={s.headerSub}>{data.monthLabel} · {data.clientName}</Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumo</Text>
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statGold}>{data.trainings}</Text>
              <Text style={s.statLabel}>Treinos{"\n"}completados</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{data.checkins}</Text>
              <Text style={s.statLabel}>Check-ins{"\n"}realizados</Text>
            </View>
            <View style={s.statBox}>
              <Text style={data.avgEnergy ? s.statGold : s.statValue}>
                {data.avgEnergy ? `${data.avgEnergy}/5` : "—"}
              </Text>
              <Text style={s.statLabel}>Energia{"\n"}média</Text>
            </View>
            <View style={s.statBox}>
              <Text style={data.prs.length ? s.statGold : s.statValue}>{data.prs.length}</Text>
              <Text style={s.statLabel}>Recordes{"\n"}pessoais</Text>
            </View>
          </View>
        </View>

        {/* Weight evolution */}
        {(data.firstWeight || data.lastWeight) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Evolução de Peso</Text>
            <View style={s.row}>
              <Text style={s.rowLabel}>Peso inicial</Text>
              <Text style={s.rowValue}>{data.firstWeight ? `${data.firstWeight} kg` : "—"}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Peso final</Text>
              <Text style={s.rowValue}>{data.lastWeight ? `${data.lastWeight} kg` : "—"}</Text>
            </View>
            {data.weightDelta !== null && (
              <View style={s.row}>
                <Text style={s.rowLabel}>Variação</Text>
                <Text style={data.weightDelta <= 0 ? s.rowGold : { ...s.rowValue, color: "#EF4444" }}>
                  {data.weightDelta > 0 ? "+" : ""}{data.weightDelta} kg
                </Text>
              </View>
            )}
          </View>
        )}

        {/* PRs */}
        {data.prs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recordes Pessoais do Mês</Text>
            {data.prs.map((pr, i) => (
              <View key={i} style={s.row}>
                <Text style={s.rowLabel}>{pr.exercise_name}</Text>
                <Text style={s.rowGold}>
                  {pr.weight_kg ? `${pr.weight_kg} kg` : ""}
                  {pr.weight_kg && pr.reps ? " · " : ""}
                  {pr.reps ? `${pr.reps} reps` : ""}
                  {pr.achieved_at ? `  ${fmtDate(pr.achieved_at)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {data.notes.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notas dos Check-ins</Text>
            {data.notes.map((n, i) => (
              <View key={i} style={s.noteBox}>
                <Text style={s.noteWeek}>Semana de {fmtDate(n.week)}</Text>
                <Text style={s.noteText}>{n.note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>KRAV Coaching · Confidencial</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ── Button component ──────────────────────────────────────────────────────────
export default function PDFGenerator({ month }: { month: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const generate = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/report/pdf?month=${month}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json() as ReportData;

      const blob = await pdf(<ReportDocument data={data} />).toBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `KRAV_Relatorio_${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [month]);

  return (
    <button
      onClick={generate}
      disabled={status === "loading"}
      className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)", color: "#000" }}
    >
      {status === "loading" && (
        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      )}
      {status === "idle"    && "⬇ Descarregar PDF"}
      {status === "loading" && "A gerar PDF..."}
      {status === "done"    && "✓ PDF descarregado!"}
      {status === "error"   && "Erro — tenta novamente"}
    </button>
  );
}
