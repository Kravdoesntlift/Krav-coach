"use client";

import { useState } from "react";
import { signupAndStartCheckout } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Goal = "lose_weight" | "gain_muscle" | "athletic";
type Level = "beginner" | "intermediate" | "advanced";

type Equipment =
  | "gym_full"
  | "gym_basic"
  | "home_none"
  | "home_weights"
  | "outdoor";

interface QuizState {
  goal: Goal | null;
  level: Level | null;
  availableDays: number;
  injuries: string;
  noInjuries: boolean;
  equipment: Equipment | null;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TOTAL_STEPS = 6;

// ─── Step option cards ────────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  icon,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left active:scale-[0.98]"
      style={{
        background: selected
          ? "rgba(201,168,76,0.10)"
          : "rgba(255,255,255,0.03)",
        border: selected
          ? "1.5px solid #C9A84C"
          : "1.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-white font-semibold text-sm leading-snug">{label}</p>
        {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
      </div>
      {selected && (
        <span
          className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          ✓
        </span>
      )}
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>Passo {step} de {TOTAL_STEPS}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#E8C96B,#C9A84C)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StartPage() {
  const [step, setStep] = useState(1);
  const [quiz, setQuiz] = useState<QuizState>({
    goal: null,
    level: null,
    availableDays: 3,
    injuries: "",
    noInjuries: false,
    equipment: null,
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof QuizState>(key: K, value: QuizState[K]) {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  }

  function canContinue(): boolean {
    if (step === 1) return quiz.goal !== null;
    if (step === 2) return quiz.level !== null;
    if (step === 3) return quiz.availableDays >= 2;
    if (step === 4) return quiz.noInjuries || quiz.injuries.trim().length > 0;
    if (step === 5) return quiz.equipment !== null;
    if (step === 6) {
      return (
        quiz.fullName.trim().length > 0 &&
        quiz.email.trim().length > 0 &&
        quiz.password.length >= 6 &&
        quiz.password === quiz.confirmPassword
      );
    }
    return false;
  }

  async function handleContinue() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }

    // Step 6 — submit
    setLoading(true);
    setError(null);
    try {
      const result = await signupAndStartCheckout({
        fullName: quiz.fullName.trim(),
        email: quiz.email.trim().toLowerCase(),
        password: quiz.password,
        goal: quiz.goal!,
        level: quiz.level!,
        availableDays: quiz.availableDays,
        injuries: quiz.noInjuries ? "" : quiz.injuries.trim(),
        equipment: quiz.equipment!,
      });
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.redirectTo) {
        window.location.href = result.redirectTo;
      } else {
        setError("Erro inesperado. Tenta novamente.");
        setLoading(false);
      }
    } catch {
      setError("Erro de rede. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen max-w-sm mx-auto w-full px-5">
        {/* Logo */}
        <div className="pt-6 pb-4">
          <span className="text-xl font-black tracking-tighter">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
        </div>

        {/* Progress */}
        <div className="pb-8">
          <ProgressBar step={step} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* STEP 1 — Objetivo */}
          {step === 1 && (
            <StepWrapper title="Qual é o teu objetivo principal?">
              <OptionCard
                selected={quiz.goal === "lose_weight"}
                onClick={() => set("goal", "lose_weight")}
                icon="🔥"
                label="Perder peso e definir"
                sub="Eliminar gordura e ganhar definição muscular"
              />
              <OptionCard
                selected={quiz.goal === "gain_muscle"}
                onClick={() => set("goal", "gain_muscle")}
                icon="💪"
                label="Ganhar massa muscular"
                sub="Aumentar força e volume muscular"
              />
              <OptionCard
                selected={quiz.goal === "athletic"}
                onClick={() => set("goal", "athletic")}
                icon="🏃"
                label="Melhorar condição física"
                sub="Resistência, saúde e energia no dia a dia"
              />
            </StepWrapper>
          )}

          {/* STEP 2 — Nível */}
          {step === 2 && (
            <StepWrapper title="Qual é o teu nível de treino?">
              <OptionCard
                selected={quiz.level === "beginner"}
                onClick={() => set("level", "beginner")}
                icon="🌱"
                label="Iniciante"
                sub="Menos de 6 meses de treino regular"
              />
              <OptionCard
                selected={quiz.level === "intermediate"}
                onClick={() => set("level", "intermediate")}
                icon="📈"
                label="Intermédio"
                sub="Entre 6 meses e 2 anos de treino"
              />
              <OptionCard
                selected={quiz.level === "advanced"}
                onClick={() => set("level", "advanced")}
                icon="🏆"
                label="Avançado"
                sub="Mais de 2 anos de treino consistente"
              />
            </StepWrapper>
          )}

          {/* STEP 3 — Disponibilidade */}
          {step === 3 && (
            <StepWrapper title="Quantos dias por semana podes treinar?">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-0">
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("availableDays", d)}
                      className="flex-1 py-5 font-black text-lg transition-all active:scale-95"
                      style={{
                        background:
                          quiz.availableDays === d
                            ? "linear-gradient(135deg,#E8C96B,#C9A84C)"
                            : "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: quiz.availableDays === d ? "#000" : "#71717a",
                        borderRadius:
                          d === 2 ? "1rem 0 0 1rem" : d === 7 ? "0 1rem 1rem 0" : "0",
                        borderLeft: d === 2 ? undefined : "none",
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-center text-zinc-500 text-sm">
                  {quiz.availableDays === 2 && "2 dias — treino mínimo mas eficaz"}
                  {quiz.availableDays === 3 && "3 dias — o mais recomendado para começar"}
                  {quiz.availableDays === 4 && "4 dias — ótimo equilíbrio treino/recuperação"}
                  {quiz.availableDays === 5 && "5 dias — ritmo avançado, exige boa recuperação"}
                  {quiz.availableDays === 6 && "6 dias — máxima intensidade, para avançados"}
                  {quiz.availableDays === 7 && "7 dias — todos os dias, sem dias de descanso programados"}
                </p>
              </div>
            </StepWrapper>
          )}

          {/* STEP 4 — Limitações */}
          {step === 4 && (
            <StepWrapper title="Tens alguma lesão ou limitação física?">
              <div className="space-y-4">
                {!quiz.noInjuries && (
                  <textarea
                    value={quiz.injuries}
                    onChange={(e) => set("injuries", e.target.value)}
                    placeholder="Ex: dor no joelho direito, hérnia lombar, ombro operado..."
                    rows={4}
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                )}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => {
                      set("noInjuries", !quiz.noInjuries);
                      if (!quiz.noInjuries) set("injuries", "");
                    }}
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer"
                    style={{
                      background: quiz.noInjuries
                        ? "linear-gradient(135deg,#E8C96B,#A8893A)"
                        : "transparent",
                      border: quiz.noInjuries
                        ? "none"
                        : "1.5px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    {quiz.noInjuries && (
                      <span className="text-black text-[11px] font-black">✓</span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-300">
                    Não tenho lesões nem limitações físicas
                  </span>
                </label>
              </div>
            </StepWrapper>
          )}

          {/* STEP 5 — Equipamento */}
          {step === 5 && (
            <StepWrapper title="Onde vais treinar?">
              <OptionCard
                selected={quiz.equipment === "gym_full"}
                onClick={() => set("equipment", "gym_full")}
                icon="🏋️"
                label="Ginásio completo"
                sub="Pesos livres, máquinas, cabos e mais"
              />
              <OptionCard
                selected={quiz.equipment === "gym_basic"}
                onClick={() => set("equipment", "gym_basic")}
                icon="🏃"
                label="Ginásio básico"
                sub="Halteres, barras e equipamentos essenciais"
              />
              <OptionCard
                selected={quiz.equipment === "home_weights"}
                onClick={() => set("equipment", "home_weights")}
                icon="🏠"
                label="Casa com pesos"
                sub="Halteres, bandas elásticas ou barra em casa"
              />
              <OptionCard
                selected={quiz.equipment === "home_none"}
                onClick={() => set("equipment", "home_none")}
                icon="🛋️"
                label="Casa sem equipamento"
                sub="Apenas peso corporal (bodyweight)"
              />
              <OptionCard
                selected={quiz.equipment === "outdoor"}
                onClick={() => set("equipment", "outdoor")}
                icon="🌳"
                label="Ar livre"
                sub="Parques, campos ou corrida ao exterior"
              />
            </StepWrapper>
          )}

          {/* STEP 6 — Criar conta */}
          {step === 6 && (
            <StepWrapper title="Cria a tua conta">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={quiz.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="João Silva"
                    autoComplete="name"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={quiz.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="joao@exemplo.com"
                    autoComplete="email"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={quiz.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">
                    Confirmar password
                  </label>
                  <input
                    type="password"
                    value={quiz.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Repete a password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                  {quiz.confirmPassword.length > 0 &&
                    quiz.password !== quiz.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1 ml-1">
                        As passwords não coincidem.
                      </p>
                    )}
                </div>

                <p className="text-zinc-600 text-xs text-center pt-1">
                  Ao criar conta aceitas os nossos termos de serviço.
                  7 dias grátis, sem cartão de crédito.
                </p>
              </div>
            </StepWrapper>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="pb-8 pt-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((s) => s - 1);
              }}
              disabled={loading}
              className="flex-none px-5 py-4 rounded-2xl bg-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue() || loading}
            className="flex-1 py-4 rounded-2xl font-bold text-black text-sm transition-all active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                A processar...
              </span>
            ) : step === TOTAL_STEPS ? (
              "Começar trial gratuito de 7 dias"
            ) : (
              "Continuar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

function StepWrapper({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-black tracking-tight text-white leading-snug">
        {title}
      </h1>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
