"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/useLang";

const extra = {
  goals: {
    pt: [
      { value: "lose_weight", label: "Perder Peso", icon: "⚡" },
      { value: "gain_muscle", label: "Ganhar Músculo", icon: "💪" },
      { value: "maintain",    label: "Manter Forma", icon: "⚖️" },
      { value: "athletic",    label: "Performance Desportiva", icon: "🏃" },
      { value: "health",      label: "Saúde Geral", icon: "❤️" },
    ],
    en: [
      { value: "lose_weight", label: "Lose Weight", icon: "⚡" },
      { value: "gain_muscle", label: "Gain Muscle", icon: "💪" },
      { value: "maintain",    label: "Stay in Shape", icon: "⚖️" },
      { value: "athletic",    label: "Athletic Performance", icon: "🏃" },
      { value: "health",      label: "General Health", icon: "❤️" },
    ],
  },
  levels: {
    pt: [
      { value: "beginner",     label: "Iniciante",   desc: "Menos de 1 ano de treino" },
      { value: "intermediate", label: "Intermédio",  desc: "1 a 3 anos de treino" },
      { value: "advanced",     label: "Avançado",    desc: "Mais de 3 anos de treino" },
    ],
    en: [
      { value: "beginner",     label: "Beginner",     desc: "Less than 1 year of training" },
      { value: "intermediate", label: "Intermediate", desc: "1 to 3 years of training" },
      { value: "advanced",     label: "Advanced",     desc: "More than 3 years of training" },
    ],
  },
  days: {
    pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  step1_title:   { pt: "Qual é o teu objetivo?", en: "What is your goal?" },
  step1_sub:     { pt: "Seleciona o que melhor te descreve.", en: "Select what best describes you." },
  step2_title:   { pt: "Qual é o teu nível?", en: "What is your level?" },
  step2_sub:     { pt: "Sê honesto — ajuda o coach a planear melhor.", en: "Be honest — it helps the coach plan better." },
  step3_title:   { pt: "Quando podes treinar?", en: "When can you train?" },
  step3_sub:     { pt: "Seleciona os dias disponíveis.", en: "Select your available days." },
  step4_title:   { pt: "Tens lesões ou limitações?", en: "Do you have any injuries or limitations?" },
  step4_sub:     { pt: "Opcional — o coach vai ter em conta.", en: "Optional — the coach will take this into account." },
  injuries_placeholder: { pt: "Ex: Dor no joelho direito, hérnia discal L4-L5...", en: "E.g. Right knee pain, L4-L5 disc herniation..." },
  continue:      { pt: "Continuar", en: "Continue" },
  back:          { pt: "Voltar", en: "Back" },
  saving:        { pt: "A guardar...", en: "Saving..." },
  start:         { pt: "Começar!", en: "Get started!" },
} as const;

export default function OnboardingForm({ clientId }: { clientId: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [injuries, setInjuries] = useState("");
  const [saving, setSaving] = useState(false);

  const GOALS = extra.goals[lang];
  const LEVELS = extra.levels[lang];
  const DAYS = extra.days[lang];

  function toggleDay(d: number) {
    setAvailableDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("client_onboarding").insert({
      client_id: clientId,
      goal,
      level,
      available_days: availableDays,
      injuries: injuries.trim() || null,
    });
    router.push("/client/dashboard");
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-brand-gold" : "bg-zinc-700"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">{extra.step1_title[lang]}</h2>
            <p className="text-gray-500 text-sm mt-1">{extra.step1_sub[lang]}</p>
          </div>
          <div className="space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors text-left ${
                  goal === g.value ? "border-brand-gold bg-brand-gold/10 text-white" : "border-zinc-700 text-gray-300 hover:border-zinc-500"
                }`}
              >
                <span className="text-2xl">{g.icon}</span>
                <span className="font-medium">{g.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!goal}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-40"
          >
            {extra.continue[lang]}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">{extra.step2_title[lang]}</h2>
            <p className="text-gray-500 text-sm mt-1">{extra.step2_sub[lang]}</p>
          </div>
          <div className="space-y-2">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={`w-full flex flex-col px-4 py-3.5 rounded-xl border transition-colors text-left ${
                  level === l.value ? "border-brand-gold bg-brand-gold/10" : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <span className={`font-medium ${level === l.value ? "text-white" : "text-gray-300"}`}>{l.label}</span>
                <span className="text-gray-500 text-xs mt-0.5">{l.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">{extra.back[lang]}</button>
            <button onClick={() => setStep(3)} disabled={!level} className="flex-1 btn-primary py-3 disabled:opacity-40">{extra.continue[lang]}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">{extra.step3_title[lang]}</h2>
            <p className="text-gray-500 text-sm mt-1">{extra.step3_sub[lang]}</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`min-h-[44px] rounded-xl text-xs font-bold transition-colors ${
                  availableDays.includes(i) ? "bg-brand-gold text-black" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">{extra.back[lang]}</button>
            <button onClick={() => setStep(4)} disabled={availableDays.length === 0} className="flex-1 btn-primary py-3 disabled:opacity-40">{extra.continue[lang]}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">{extra.step4_title[lang]}</h2>
            <p className="text-gray-500 text-sm mt-1">{extra.step4_sub[lang]}</p>
          </div>
          <textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder={extra.injuries_placeholder[lang]}
            rows={4}
            className="input resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">{extra.back[lang]}</button>
            <button onClick={finish} disabled={saving} className="flex-1 btn-primary py-3 disabled:opacity-40">
              {saving ? extra.saving[lang] : extra.start[lang]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
