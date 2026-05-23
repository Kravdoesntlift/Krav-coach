"use client";

import { useEffect, useState } from "react";

interface ScoreEntry {
  rank: number;
  clientId: string;
  displayName: string;
  isMe: boolean;
  score: number;
  breakdown: {
    workoutCount: number;
    checkinCount: number;
    nutritionDays: number;
    totalSteps: number;
  };
}

interface Challenge {
  id: string;
  reward_title: string;
  reward_description: string | null;
  reward_image_url: string | null;
  points_per_workout: number;
  points_per_checkin: number;
  points_per_nutrition: number;
  points_per_1000_steps: number;
  winner_client_id: string | null;
  winner_announced: boolean;
}

interface LeaderboardData {
  challenge: Challenge | null;
  scores: ScoreEntry[];
  monthStart: string;
  weights: { workout: number; checkin: number; nutrition: number; steps1k: number };
}

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthLabel(ms: string) {
  return new Date(ms + "T00:00:00").toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function CoachChallengesPage() {
  const [month, setMonth] = useState(currentMonthStart());
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pWorkout, setPWorkout] = useState(10);
  const [pCheckin, setPCheckin] = useState(15);
  const [pNutrition, setPNutrition] = useState(5);
  const [pSteps, setPSteps] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [announcingId, setAnnouncingId] = useState<string | null>(null);
  const [announcing, setAnnouncing] = useState(false);

  async function loadData(m: string) {
    setLoading(true);
    const r = await fetch(`/api/leaderboard?month=${m}`);
    const d: LeaderboardData = await r.json();
    setData(d);
    if (d.challenge) {
      setTitle(d.challenge.reward_title);
      setDesc(d.challenge.reward_description ?? "");
      setImageUrl(d.challenge.reward_image_url ?? "");
      setPWorkout(d.challenge.points_per_workout);
      setPCheckin(d.challenge.points_per_checkin);
      setPNutrition(d.challenge.points_per_nutrition ?? 5);
      setPSteps(d.challenge.points_per_1000_steps);
    } else {
      setTitle(""); setDesc(""); setImageUrl("");
      setPWorkout(10); setPCheckin(15); setPNutrition(5); setPSteps(2);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(month); }, [month]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setSaveMsg(null);
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        reward_title: title.trim(),
        reward_description: desc.trim() || null,
        reward_image_url: imageUrl.trim() || null,
        points_per_workout: pWorkout,
        points_per_checkin: pCheckin,
        points_per_nutrition: pNutrition,
        points_per_1000_steps: pSteps,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setSaveMsg({ type: "ok", text: "Desafio guardado!" });
      loadData(month);
    } else {
      setSaveMsg({ type: "err", text: d.error ?? "Erro ao guardar." });
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  }

  async function handleAnnounce(clientId: string) {
    if (!data?.challenge) return;
    setAnnouncing(true); setAnnouncingId(clientId);
    const res = await fetch("/api/challenges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: data.challenge.id, winner_client_id: clientId }),
    });
    if (res.ok) { loadData(month); }
    setAnnouncing(false); setAnnouncingId(null);
  }

  // Generate list of past 6 months for the selector
  const monthOptions: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }

  return (
    <div className="space-y-6 page-enter pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Desafio Mensal</h1>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input text-sm py-1.5 px-3 w-auto"
        >
          {monthOptions.map((m) => (
            <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Reward setup form */}
      <div className="card p-5 space-y-4">
        <p className="text-brand-gold font-bold text-sm uppercase tracking-wide">🏆 Recompensa</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Título da recompensa *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Pré-treino MyProtein Impact"
              className="input"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="ex: 1 saco de 1kg de pré-treino Impact da MyProtein à escolha do vencedor!"
              rows={3}
              className="input resize-none"
              maxLength={300}
            />
          </div>
          <div>
            <label className="label">URL da imagem (opcional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="input"
            />
          </div>

          {/* Scoring weights */}
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Pontuação por ação</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "🏋️ Treino", value: pWorkout, set: setPWorkout },
                { label: "📋 Check-in", value: pCheckin, set: setPCheckin },
                { label: "🥗 Dia nutrição", value: pNutrition, set: setPNutrition },
                { label: "👟 Por 1000 passos", value: pSteps, set: setPSteps },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="label text-[11px]">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => set(parseInt(e.target.value) || 0)}
                      className="input text-center py-1.5 font-bold"
                    />
                    <span className="text-gray-500 text-xs whitespace-nowrap">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !title.trim()} className="btn-primary text-sm py-2 disabled:opacity-40">
              {saving ? "A guardar…" : data?.challenge ? "Atualizar desafio" : "Criar desafio"}
            </button>
            {saveMsg && (
              <span className={`text-xs font-semibold ${saveMsg.type === "ok" ? "text-green-400" : "text-red-400"}`}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <p className="text-gray-400 text-sm font-semibold capitalize">
          Classificação · {monthLabel(month)}
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.scores.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Ainda não há atividade registada este mês.</p>
        ) : (
          data?.scores.map((entry) => (
            <div
              key={entry.clientId}
              className={`card p-4 flex items-center gap-3 ${
                data.challenge?.winner_client_id === entry.clientId ? "border-brand-gold/40" : ""
              }`}
            >
              <div className="w-8 text-center">
                {entry.rank <= 3
                  ? <span className="text-2xl">{MEDAL[entry.rank - 1]}</span>
                  : <span className="text-gray-500 font-bold text-sm">#{entry.rank}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">
                  {entry.displayName}
                  {data.challenge?.winner_client_id === entry.clientId && data.challenge.winner_announced && (
                    <span className="ml-2 text-brand-gold text-xs">🏆 Vencedor</span>
                  )}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {entry.breakdown.workoutCount}🏋️ · {entry.breakdown.checkinCount}📋 · {entry.breakdown.nutritionDays}🥗 · {(entry.breakdown.totalSteps / 1000).toFixed(1)}k👟
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-lg">{entry.score}</p>
                <p className="text-gray-600 text-xs">pts</p>
              </div>
              {/* Announce winner button */}
              {data.challenge && !data.challenge.winner_announced && (
                <button
                  onClick={() => handleAnnounce(entry.clientId)}
                  disabled={announcing && announcingId === entry.clientId}
                  className="ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {announcing && announcingId === entry.clientId ? "…" : "Anunciar"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
