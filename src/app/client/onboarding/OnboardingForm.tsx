"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GOALS = [
  { value: "lose_weight", label: "Perder Peso", icon: "⚡" },
  { value: "gain_muscle", label: "Ganhar Músculo", icon: "💪" },
  { value: "maintain", label: "Manter Forma", icon: "⚖️" },
  { value: "athletic", label: "Performance Desportiva", icon: "🏃" },
  { value: "health", label: "Saúde Geral", icon: "❤️" },
];

const LEVELS = [
  { value: "beginner", label: "Iniciante", desc: "Menos de 1 ano de treino" },
  { value: "intermediate", label: "Intermédio", desc: "1 a 3 anos de treino" },
  { value: "advanced", label: "Avançado", desc: "Mais de 3 anos de treino" },
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function OnboardingForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [injuries, setInjuries] = useState("");
  const [saving, setSaving] = useState(false);

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
            <h2 className="text-white text-xl font-bold">Qual é o teu objetivo?</h2>
            <p className="text-gray-500 text-sm mt-1">Seleciona o que melhor te descreve.</p>
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
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">Qual é o teu nível?</h2>
            <p className="text-gray-500 text-sm mt-1">Sê honesto — ajuda o coach a planear melhor.</p>
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
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">Voltar</button>
            <button onClick={() => setStep(3)} disabled={!level} className="flex-1 btn-primary py-3 disabled:opacity-40">Continuar</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">Quando podes treinar?</h2>
            <p className="text-gray-500 text-sm mt-1">Seleciona os dias disponíveis.</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`py-3 rounded-xl text-xs font-bold transition-colors ${
                  availableDays.includes(i) ? "bg-brand-gold text-black" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">Voltar</button>
            <button onClick={() => setStep(4)} disabled={availableDays.length === 0} className="flex-1 btn-primary py-3 disabled:opacity-40">Continuar</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-white text-xl font-bold">Tens lesões ou limitações?</h2>
            <p className="text-gray-500 text-sm mt-1">Opcional — o coach vai ter em conta.</p>
          </div>
          <textarea
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            placeholder="Ex: Dor no joelho direito, hérnia discal L4-L5..."
            rows={4}
            className="input resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-gray-400 text-sm">Voltar</button>
            <button onClick={finish} disabled={saving} className="flex-1 btn-primary py-3 disabled:opacity-40">
              {saving ? "A guardar..." : "Começar!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
