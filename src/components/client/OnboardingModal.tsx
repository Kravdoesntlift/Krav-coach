"use client";

import { useState } from "react";
import { saveOnboarding } from "@/app/client/actions";
import { useLang } from "@/lib/i18n/useLang";

interface Props {
  clientId: string;
  onComplete: () => void;
}

export default function OnboardingModal({ clientId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goals, setGoals] = useState("");
  const [injuries, setInjuries] = useState("");
  const [availability, setAvailability] = useState(3);
  const [equipment, setEquipment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { lang } = useLang();
  const isEN = lang === "en";

  const LEVELS = isEN
    ? [
        { value: "beginner",     label: "Beginner",     desc: "Less than 6 months of training" },
        { value: "intermediate", label: "Intermediate", desc: "6 months to 2 years" },
        { value: "advanced",     label: "Advanced",     desc: "More than 2 years" },
      ]
    : [
        { value: "beginner",     label: "Iniciante",   desc: "Menos de 6 meses de treino" },
        { value: "intermediate", label: "Intermédio",  desc: "6 meses a 2 anos" },
        { value: "advanced",     label: "Avançado",    desc: "Mais de 2 anos" },
      ];

  const EQUIPMENT_OPTIONS = isEN
    ? ["Full gym", "Basic gym", "Home (no equipment)", "Home (with weights)", "Outdoors"]
    : ["Ginásio completo", "Ginásio básico", "Casa (sem equipamento)", "Casa (com pesos)", "Ar livre"];

  async function handleFinish() {
    setSaving(true);
    setSaveError(null);

    const result = await saveOnboarding({
      clientId,
      fitnessLevel,
      goalsText:   goals.trim() || null,
      injuries:    injuries.trim() || null,
      availability,
      equipment:   equipment || null,
    });

    try { localStorage.setItem(`krav_onboarding_done_${clientId}`, "1"); } catch { /* ignore */ }

    if (result?.error) {
      console.warn("Onboarding save error:", result.error);
    }

    setSaving(false);
    onComplete();
  }

  const dayLabel = isEN
    ? availability === 1 ? "1 day — effective minimum"
      : availability <= 3 ? `${availability} days — great to start`
      : availability <= 5 ? `${availability} days — excellent commitment`
      : `${availability} days — dedicated athlete!`
    : availability === 1 ? "1 dia — mínimo eficaz"
      : availability <= 3 ? `${availability} dias — ótimo para começar`
      : availability <= 5 ? `${availability} dias — excelente comprometimento`
      : `${availability} dias — atleta dedicado!`;

  const steps = [
    {
      title: isEN ? "What's your level?" : "Qual é o teu nível?",
      subtitle: isEN ? "Help us personalise your programme" : "Ajuda-nos a personalizar o teu programa",
      content: (
        <div className="space-y-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => { setFitnessLevel(l.value); setStep(1); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                fitnessLevel === l.value
                  ? "border-brand-gold bg-brand-gold/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
              }`}
            >
              <p className="text-white font-semibold text-sm">{l.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{l.desc}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: isEN ? "What's your goal?" : "Qual é o teu objetivo?",
      subtitle: isEN ? "Be specific — the more detail, the better the plan" : "Sê específico — quanto mais detalhe, melhor o plano",
      content: (
        <div className="space-y-3">
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder={isEN
              ? "E.g. Lose 8kg by summer, build muscle in arms, improve endurance..."
              : "Ex: Quero perder 8kg até ao verão, ganhar massa muscular nos braços, melhorar a resistência..."}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
            maxLength={500}
          />
          <button
            onClick={() => setStep(2)}
            disabled={!goals.trim()}
            className="w-full py-3 bg-brand-gold text-black font-bold rounded-xl disabled:opacity-40"
          >
            {isEN ? "Continue →" : "Continuar →"}
          </button>
        </div>
      ),
    },
    {
      title: isEN ? "Any injuries or limitations?" : "Tens alguma lesão ou limitação?",
      subtitle: isEN ? "Important to avoid exercises that could make things worse" : "Importante para evitar exercícios que possam piorar",
      content: (
        <div className="space-y-3">
          <textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder={isEN
              ? "E.g. Right knee — ACL surgery in 2022. No high-impact exercises..."
              : "Ex: Joelho direito — ligamento cruzado operado em 2022. Sem exercícios de impacto..."}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
            maxLength={500}
          />
          <button
            onClick={() => setStep(3)}
            className="w-full py-3 bg-brand-gold text-black font-bold rounded-xl"
          >
            {injuries.trim()
              ? (isEN ? "Continue →" : "Continuar →")
              : (isEN ? "No limitations →" : "Nenhuma limitação →")}
          </button>
        </div>
      ),
    },
    {
      title: isEN ? "How many days a week can you train?" : "Quantos dias por semana podes treinar?",
      subtitle: isEN ? "Be realistic — consistency beats intensity" : "Sê realista — consistência supera intensidade",
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAvailability((n) => Math.max(1, n - 1))}
                className="w-12 h-12 rounded-full bg-zinc-800 text-white text-xl hover:bg-zinc-700 transition-colors"
              >−</button>
              <span className="text-brand-gold text-5xl font-bold w-16 text-center">{availability}</span>
              <button
                onClick={() => setAvailability((n) => Math.min(7, n + 1))}
                className="w-12 h-12 rounded-full bg-zinc-800 text-white text-xl hover:bg-zinc-700 transition-colors"
              >+</button>
            </div>
          </div>
          <p className="text-gray-400 text-sm text-center">{dayLabel}</p>
          <button
            onClick={() => setStep(4)}
            className="w-full py-3 bg-brand-gold text-black font-bold rounded-xl"
          >
            {isEN ? "Continue →" : "Continuar →"}
          </button>
        </div>
      ),
    },
    {
      title: isEN ? "Where will you train?" : "Onde vais treinar?",
      subtitle: isEN ? "We'll adapt the programme to your context" : "Adapta o programa ao teu contexto",
      content: (
        <div className="space-y-3">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq}
              onClick={() => setEquipment(eq)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                equipment === eq
                  ? "border-brand-gold bg-brand-gold/10 text-white font-semibold"
                  : "border-zinc-700 bg-zinc-800 text-gray-300 hover:border-zinc-500"
              }`}
            >
              {eq}
            </button>
          ))}
          <button
            onClick={handleFinish}
            disabled={saving || !equipment}
            className="w-full py-3 bg-brand-gold text-black font-bold rounded-xl mt-2 disabled:opacity-40"
          >
            {saving ? (isEN ? "Saving..." : "A guardar...") : (isEN ? "Finish →" : "Concluir →")}
          </button>
        </div>
      ),
    },
  ];

  const cur = steps[step];

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-950 flex flex-col">
      {/* Progress */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-brand-gold transition-all duration-500"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        {/* Logo */}
        <p className="text-brand-gold font-black text-lg mb-8 tracking-tight">KRAV.</p>

        {/* Step indicator */}
        <p className="text-gray-500 text-xs mb-2">{step + 1} / {steps.length}</p>

        <h2 className="text-white text-2xl font-bold mb-1">{cur.title}</h2>
        <p className="text-gray-400 text-sm mb-6">{cur.subtitle}</p>

        {cur.content}

        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-4 text-gray-600 text-xs hover:text-gray-400 transition-colors text-center w-full"
          >
            {isEN ? "← Back" : "← Voltar"}
          </button>
        )}
      </div>
    </div>
  );
}
