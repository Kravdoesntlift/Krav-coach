"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WeeklyCheckin } from "@/lib/supabase/types";
import { haptic, HAPTIC } from "@/lib/haptic";
import { useLang } from "@/lib/i18n/useLang";

interface Props {
  clientId: string;
  weekStart: string;
  existing: WeeklyCheckin | null;
}

// ─── Scale configs ────────────────────────────────────────────────────────────
const ENERGY_OPTS_PT = [
  { v: 1, emoji: "😴", label: "Esgotado"  },
  { v: 2, emoji: "😪", label: "Cansado"   },
  { v: 3, emoji: "😐", label: "Normal"    },
  { v: 4, emoji: "💪", label: "Bem"       },
  { v: 5, emoji: "⚡", label: "Excelente" },
];

const ENERGY_OPTS_EN = [
  { v: 1, emoji: "😴", label: "Exhausted" },
  { v: 2, emoji: "😪", label: "Tired"     },
  { v: 3, emoji: "😐", label: "Normal"    },
  { v: 4, emoji: "💪", label: "Good"      },
  { v: 5, emoji: "⚡", label: "Excellent" },
];

const SLEEP_OPTS_PT = [
  { v: 1, emoji: "😵", label: "Péssimo"  },
  { v: 2, emoji: "😞", label: "Mau"      },
  { v: 3, emoji: "😐", label: "Regular"  },
  { v: 4, emoji: "😊", label: "Bom"      },
  { v: 5, emoji: "🌙", label: "Ótimo"    },
];

const SLEEP_OPTS_EN = [
  { v: 1, emoji: "😵", label: "Terrible" },
  { v: 2, emoji: "😞", label: "Bad"      },
  { v: 3, emoji: "😐", label: "Fair"     },
  { v: 4, emoji: "😊", label: "Good"     },
  { v: 5, emoji: "🌙", label: "Great"    },
];

const STRESS_OPTS_PT = [
  { v: 1, emoji: "🧘", label: "Relaxado" },
  { v: 2, emoji: "😌", label: "Calmo"    },
  { v: 3, emoji: "😐", label: "Normal"   },
  { v: 4, emoji: "😤", label: "Tenso"    },
  { v: 5, emoji: "🤯", label: "Esgotado" },
];

const STRESS_OPTS_EN = [
  { v: 1, emoji: "🧘", label: "Relaxed"  },
  { v: 2, emoji: "😌", label: "Calm"     },
  { v: 3, emoji: "😐", label: "Normal"   },
  { v: 4, emoji: "😤", label: "Tense"    },
  { v: 5, emoji: "🤯", label: "Stressed" },
];

// ─── Emoji scale row ──────────────────────────────────────────────────────────
function EmojiScale({
  opts,
  value,
  onChange,
}: {
  opts: { v: number; emoji: string; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {opts.map(({ v, emoji, label }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(active ? 0 : v)}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
            style={{
              background: active
                ? "rgba(201,168,76,0.15)"
                : "rgba(39,39,42,0.6)",
              border: active
                ? "1px solid rgba(201,168,76,0.5)"
                : "1px solid rgba(63,63,70,0.4)",
            }}
          >
            <span className={`text-xl transition-transform ${active ? "scale-110" : "grayscale opacity-50"}`}>
              {emoji}
            </span>
            <span
              className="text-[9px] font-semibold leading-tight text-center"
              style={{ color: active ? "#C9A84C" : "#52525b" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function CheckinForm({ clientId, weekStart, existing }: Props) {
  const { t, lang } = useLang();

  const extra = {
    current_weight:   { pt: "Peso atual",          en: "Current weight" },
    sleep_quality:    { pt: "Qualidade do sono",   en: "Sleep quality" },
    stress_level:     { pt: "Nível de stress",     en: "Stress level" },
    body_measures:    { pt: "Medidas corporais",   en: "Body measurements" },
    notes_for_coach:  { pt: "Notas para o coach",  en: "Notes for coach" },
    checkin_sent:     { pt: "Check-in enviado!",   en: "Check-in sent!" },
    coach_sees:       { pt: "O teu coach vai ver o teu progresso esta semana.", en: "Your coach will see your progress this week." },
    edit_answer:      { pt: "Editar resposta",     en: "Edit answer" },
    select_energy:    { pt: "Seleciona o teu nível de energia.", en: "Please select your energy level." },
    save_error:       { pt: "Erro ao guardar. Tenta novamente.", en: "Error saving. Please try again." },
    saving:           { pt: "A guardar...",        en: "Saving..." },
    update_checkin:   { pt: "Atualizar check-in",  en: "Update check-in" },
    send_checkin:     { pt: "Enviar check-in",     en: "Send check-in" },
  } as const;

  const ENERGY_OPTS = lang === "pt" ? ENERGY_OPTS_PT : ENERGY_OPTS_EN;
  const SLEEP_OPTS  = lang === "pt" ? SLEEP_OPTS_PT  : SLEEP_OPTS_EN;
  const STRESS_OPTS = lang === "pt" ? STRESS_OPTS_PT : STRESS_OPTS_EN;

  const [weight,  setWeight]  = useState(existing?.weight_kg?.toString() ?? "");
  const [energy,  setEnergy]  = useState(existing?.energy_level ?? 0);
  const [sleep,   setSleep]   = useState(existing?.sleep_quality ?? 0);
  const [stress,  setStress]  = useState(existing?.stress_level ?? 0);
  const [notes,   setNotes]   = useState(existing?.notes ?? "");
  const [waist,   setWaist]   = useState(existing?.waist_cm?.toString() ?? "");
  const [chest,   setChest]   = useState(existing?.chest_cm?.toString() ?? "");
  const [arm,     setArm]     = useState(existing?.arm_cm?.toString() ?? "");
  const [showMeasures, setShowMeasures] = useState(
    !!(existing?.waist_cm || existing?.chest_cm || existing?.arm_cm)
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (energy === 0) { setError(extra.select_energy[lang]); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      client_id:     clientId,
      week_start:    weekStart,
      weight_kg:     weight ? parseFloat(weight) : null,
      energy_level:  energy,
      sleep_quality: sleep  || null,
      stress_level:  stress || null,
      notes:         notes  || null,
      waist_cm:      waist  ? parseFloat(waist) : null,
      chest_cm:      chest  ? parseFloat(chest) : null,
      arm_cm:        arm    ? parseFloat(arm)   : null,
    };

    const { error: dbError } = existing
      ? await supabase.from("weekly_checkins").update({
          weight_kg: payload.weight_kg, energy_level: payload.energy_level,
          sleep_quality: payload.sleep_quality, stress_level: payload.stress_level,
          notes: payload.notes,
          waist_cm: payload.waist_cm, chest_cm: payload.chest_cm, arm_cm: payload.arm_cm,
        }).eq("id", existing.id)
      : await supabase.from("weekly_checkins").insert(payload);

    setLoading(false);
    if (dbError) { haptic(HAPTIC.error); setError(extra.save_error[lang]); }
    else {
      haptic(HAPTIC.success);
      setSuccess(true);
      // Notify coach — fire and forget, don't block UX
      if (!existing) {
        fetch("/api/push/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStart }),
        }).catch(() => {});
      }
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl p-10 text-center animate-fade-in" style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <span className="text-green-400 text-2xl">✓</span>
        </div>
        <h2 className="text-white font-black text-xl mb-2">{extra.checkin_sent[lang]}</h2>
        <p className="text-zinc-500 text-sm mb-8">{extra.coach_sees[lang]}</p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm text-zinc-600 hover:text-white transition-colors"
        >
          {extra.edit_answer[lang]}
        </button>
      </div>
    );
  }

  const measureLabels = [
    { label: t("waist"), value: waist, set: setWaist, ph: "80" },
    { label: t("chest"), value: chest, set: setChest, ph: "100" },
    { label: t("arm"),   value: arm,   set: setArm,   ph: "38" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Peso ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <Section label={extra.current_weight[lang]}>
          <div className="flex items-center gap-3">
            <input
              type="number" step="0.1" min="0" value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="ex: 75.5"
              className="flex-1 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 text-white text-lg font-bold text-center placeholder-zinc-700 focus:outline-none focus:border-brand-gold/50 transition-colors"
            />
            <span className="text-zinc-500 text-sm font-medium">{t("kg")}</span>
          </div>
        </Section>
      </div>

      {/* ── Energia ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <Section label={t("energy_level")}>
          <EmojiScale opts={ENERGY_OPTS} value={energy} onChange={setEnergy} />
        </Section>
      </div>

      {/* ── Sono ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <Section label={extra.sleep_quality[lang]}>
          <EmojiScale opts={SLEEP_OPTS} value={sleep} onChange={setSleep} />
        </Section>
      </div>

      {/* ── Stress ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <Section label={extra.stress_level[lang]}>
          <EmojiScale opts={STRESS_OPTS} value={stress} onChange={setStress} />
        </Section>
      </div>

      {/* ── Medidas ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <button
          type="button"
          onClick={() => setShowMeasures((s) => !s)}
          className="w-full flex items-center justify-between"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
            {extra.body_measures[lang]}
          </p>
          <span
            className="text-zinc-600 text-xs transition-transform duration-300"
            style={{ transform: showMeasures ? "rotate(180deg)" : "rotate(0)", display: "inline-block" }}
          >
            ▼
          </span>
        </button>

        {showMeasures && (
          <div className="grid grid-cols-3 gap-3 pt-1 animate-fade-in">
            {measureLabels.map(({ label, value, set, ph }) => (
              <div key={label} className="space-y-1.5">
                <p className="text-[10px] text-zinc-600 text-center">{label} ({t("cm")})</p>
                <input
                  type="number" step="0.1" min="0"
                  value={value} onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-2 py-2.5 text-white text-sm font-bold text-center placeholder-zinc-700 focus:outline-none focus:border-brand-gold/50 transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notas ── */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
      >
        <Section label={extra.notes_for_coach[lang]}>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t("notes_placeholder")}
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-brand-gold/50 transition-colors resize-none"
          />
        </Section>
      </div>

      {error && (
        <p className="text-brand-gold text-sm bg-yellow-950/20 border border-brand-gold/30 rounded-2xl px-4 py-3 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl text-black font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
      >
        {loading ? extra.saving[lang] : existing ? extra.update_checkin[lang] : extra.send_checkin[lang]}
      </button>
    </form>
  );
}
