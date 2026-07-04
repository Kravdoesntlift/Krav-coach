"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signupAndStartCheckout } from "./actions";

type Lang = "pt" | "en";
type Goal = "lose_weight" | "gain_muscle" | "athletic";
type Level = "beginner" | "intermediate" | "advanced";
type Equipment = "gym_full" | "gym_basic" | "home_none" | "home_weights" | "outdoor";
type Sex = "male" | "female" | "other";

interface QuizState {
  goal: Goal | null;
  sex: Sex | null;
  age: string;
  height: string;
  currentWeight: string;
  level: Level | null;
  availableDays: number;
  sessionDuration: number;
  injuries: string;
  noInjuries: boolean;
  equipment: Equipment | null;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TOTAL_STEPS = 7;

const T = {
  step_of:          { pt: (s: number, t: number) => `Passo ${s} de ${t}`,        en: (s: number, t: number) => `Step ${s} of ${t}` },

  // Step 1 — Goal
  step1_title:      { pt: "Qual é o teu objetivo principal?",                     en: "What is your main goal?" },
  lose_weight:      { pt: "Perder peso e definir",                                en: "Lose weight & get lean" },
  lose_weight_sub:  { pt: "Eliminar gordura e ganhar definição muscular",          en: "Burn fat and gain muscle definition" },
  gain_muscle:      { pt: "Ganhar massa muscular",                                en: "Build muscle mass" },
  gain_muscle_sub:  { pt: "Aumentar força e volume muscular",                     en: "Increase strength and muscle volume" },
  athletic:         { pt: "Melhorar condição física",                             en: "Improve fitness" },
  athletic_sub:     { pt: "Resistência, saúde e energia no dia a dia",            en: "Endurance, health, and daily energy" },

  // Step 2 — Body profile
  step2_title:      { pt: "O teu perfil físico",                                  en: "Your body profile" },
  step2_sub:        { pt: "Estes dados ajudam o coach a criar um plano 100% adaptado a ti.", en: "This data helps your coach create a plan tailored specifically to you." },
  sex_label:        { pt: "Sexo biológico",                                       en: "Biological sex" },
  male:             { pt: "Masculino",                                            en: "Male" },
  female:           { pt: "Feminino",                                             en: "Female" },
  other:            { pt: "Outro",                                                en: "Other" },
  age_label:        { pt: "Idade",                                                en: "Age" },
  age_unit:         { pt: "anos",                                                 en: "years" },
  height_label:     { pt: "Altura",                                               en: "Height" },
  weight_label:     { pt: "Peso atual",                                           en: "Current weight" },

  // Step 3 — Level
  step3_title:      { pt: "Qual é o teu nível de treino?",                        en: "What is your training level?" },
  beginner:         { pt: "Iniciante",                                            en: "Beginner" },
  beginner_sub:     { pt: "Menos de 6 meses de treino regular",                   en: "Less than 6 months of regular training" },
  intermediate:     { pt: "Intermédio",                                           en: "Intermediate" },
  intermediate_sub: { pt: "Entre 6 meses e 2 anos de treino",                     en: "Between 6 months and 2 years of training" },
  advanced:         { pt: "Avançado",                                             en: "Advanced" },
  advanced_sub:     { pt: "Mais de 2 anos de treino consistente",                 en: "More than 2 years of consistent training" },

  // Step 4 — Schedule
  step4_title:      { pt: "O teu horário de treino",                              en: "Your training schedule" },
  days_label:       { pt: "Quantos dias por semana podes treinar?",               en: "How many days per week can you train?" },
  duration_label:   { pt: "Quanto tempo tens por sessão?",                        en: "How long do you have per session?" },
  days2:            { pt: "2 dias — mínimo mas eficaz",                           en: "2 days — minimal but effective" },
  days3:            { pt: "3 dias — o mais recomendado para começar",             en: "3 days — most recommended to start" },
  days4:            { pt: "4 dias — ótimo equilíbrio treino/recuperação",         en: "4 days — great training/recovery balance" },
  days5:            { pt: "5 dias — ritmo avançado, boa recuperação necessária",  en: "5 days — advanced pace, good recovery needed" },
  days6:            { pt: "6 dias — máxima intensidade, para avançados",          en: "6 days — maximum intensity, for advanced athletes" },
  days7:            { pt: "7 dias — todos os dias, sem descanso",                 en: "7 days — every day, no rest days" },
  min30:            { pt: "30 min",                                               en: "30 min" },
  min45:            { pt: "45 min",                                               en: "45 min" },
  min60:            { pt: "60 min",                                               en: "60 min" },
  min90:            { pt: "90 min+",                                              en: "90 min+" },

  // Step 5 — Injuries
  step5_title:      { pt: "Tens alguma lesão ou limitação física?",               en: "Do you have any injuries or physical limitations?" },
  injuries_placeholder: { pt: "Ex: dor no joelho direito, hérnia lombar...",      en: "E.g.: right knee pain, herniated disc..." },
  no_injuries:      { pt: "Não tenho lesões nem limitações físicas",              en: "I have no injuries or physical limitations" },

  // Step 6 — Equipment
  step6_title:      { pt: "Onde vais treinar?",                                   en: "Where will you train?" },
  gym_full:         { pt: "Ginásio completo",                                     en: "Full gym" },
  gym_full_sub:     { pt: "Pesos livres, máquinas, cabos e mais",                 en: "Free weights, machines, cables and more" },
  gym_basic:        { pt: "Ginásio básico",                                       en: "Basic gym" },
  gym_basic_sub:    { pt: "Halteres, barras e equipamentos essenciais",           en: "Dumbbells, barbells and essential equipment" },
  home_weights:     { pt: "Casa com pesos",                                       en: "Home with weights" },
  home_weights_sub: { pt: "Halteres, bandas elásticas ou barra em casa",          en: "Dumbbells, resistance bands or barbell at home" },
  home_none:        { pt: "Casa sem equipamento",                                 en: "Home, no equipment" },
  home_none_sub:    { pt: "Apenas peso corporal (bodyweight)",                    en: "Bodyweight only" },
  outdoor:          { pt: "Ar livre",                                             en: "Outdoors" },
  outdoor_sub:      { pt: "Parques, campos ou corrida ao exterior",               en: "Parks, fields or outdoor running" },

  // Step 7 — Account
  step7_title:      { pt: "Cria a tua conta",                                     en: "Create your account" },
  full_name:        { pt: "Nome completo",                                        en: "Full name" },
  name_ph:          { pt: "João Silva",                                           en: "John Smith" },
  email_lbl:        { pt: "Email",                                                en: "Email" },
  password_lbl:     { pt: "Password",                                             en: "Password" },
  password_ph:      { pt: "Mínimo 6 caracteres",                                  en: "At least 6 characters" },
  confirm_pw:       { pt: "Confirmar password",                                   en: "Confirm password" },
  confirm_pw_ph:    { pt: "Repete a password",                                    en: "Repeat password" },
  pw_mismatch:      { pt: "As passwords não coincidem.",                          en: "Passwords do not match." },
  terms_pre:        { pt: "Ao criar conta aceitas os nossos",                     en: "By creating an account you accept our" },
  terms_link:       { pt: "termos de serviço",                                    en: "terms of service" },
  terms_post:       { pt: ". 7 dias grátis, sem cartão de crédito.",              en: ". 7 days free, no credit card required." },

  back:             { pt: "Voltar",                                               en: "Back" },
  continue:         { pt: "Continuar",                                            en: "Continue" },
  start_trial:      { pt: "Começar trial gratuito de 7 dias",                    en: "Start 7-day free trial" },
  processing:       { pt: "A processar...",                                       en: "Processing..." },
  err_unexpected:   { pt: "Erro inesperado. Tenta novamente.",                    en: "Unexpected error. Please try again." },
  err_network:      { pt: "Erro de rede. Tenta novamente.",                       en: "Network error. Please try again." },
} as const;

function tx<V>(entry: { pt: V; en: V }, lang: Lang): V {
  return entry[lang];
}

// ─── Components ───────────────────────────────────────────────────────────────

function OptionCard({ selected, onClick, icon, label, sub }: {
  selected: boolean; onClick: () => void; icon: string; label: string; sub?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left active:scale-[0.98]"
      style={{
        background: selected ? "rgba(201,168,76,0.10)" : "rgba(255,255,255,0.03)",
        border: selected ? "1.5px solid #C9A84C" : "1.5px solid rgba(255,255,255,0.08)",
      }}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm leading-snug">{label}</p>
        {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
      </div>
      {selected && (
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-black shrink-0"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>✓</span>
      )}
    </button>
  );
}

function SexCard({ selected, onClick, icon, label }: {
  selected: boolean; onClick: () => void; icon: string; label: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl transition-all active:scale-95"
      style={{
        background: selected ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
        border: selected ? "1.5px solid #C9A84C" : "1.5px solid rgba(255,255,255,0.08)",
      }}>
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-semibold" style={{ color: selected ? "#C9A84C" : "#71717a" }}>{label}</span>
      {selected && (
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-black"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>✓</span>
      )}
    </button>
  );
}

function NumberInput({ label, value, onChange, unit, placeholder, min, max }: {
  label: string; value: string; onChange: (v: string) => void;
  unit: string; placeholder: string; min: number; max: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 focus-within:border-[#C9A84C] transition-colors">
        <input
          type="number" min={min} max={max} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-lg font-bold text-center placeholder-zinc-700 focus:outline-none w-0"
        />
        <span className="text-zinc-600 text-sm shrink-0">{unit}</span>
      </div>
    </div>
  );
}

function ProgressBar({ step, lang }: { step: number; lang: Lang }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{T.step_of[lang](step, TOTAL_STEPS)}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#E8C96B,#C9A84C)" }} />
      </div>
    </div>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-0 rounded-full overflow-hidden border border-zinc-700 text-[11px] font-black">
      {(["pt", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)}
          className="px-3 py-1.5 transition-all"
          style={{ background: lang === l ? "#C9A84C" : "transparent", color: lang === l ? "#000" : "#71717a" }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function StepWrapper({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight text-white leading-snug">{title}</h1>
        {sub && <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">{sub}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StartPage() {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<Lang>("pt");
  const [quiz, setQuiz] = useState<QuizState>({
    goal: null, sex: null, age: "", height: "", currentWeight: "",
    level: null, availableDays: 3, sessionDuration: 60,
    injuries: "", noInjuries: false, equipment: null,
    fullName: "", email: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith("en") || browser.startsWith("de") || browser.startsWith("fr") || browser.startsWith("it")) {
      setLang("en");
    }
  }, []);

  function set<K extends keyof QuizState>(key: K, value: QuizState[K]) {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  }

  function canContinue(): boolean {
    if (step === 1) return quiz.goal !== null;
    if (step === 2) {
      return (
        quiz.sex !== null &&
        quiz.age !== "" && parseInt(quiz.age) >= 10 && parseInt(quiz.age) <= 100 &&
        quiz.height !== "" && parseInt(quiz.height) >= 100 && parseInt(quiz.height) <= 250 &&
        quiz.currentWeight !== "" && parseFloat(quiz.currentWeight) > 0
      );
    }
    if (step === 3) return quiz.level !== null;
    if (step === 4) return quiz.availableDays >= 2 && quiz.sessionDuration > 0;
    if (step === 5) return quiz.noInjuries || quiz.injuries.trim().length > 0;
    if (step === 6) return quiz.equipment !== null;
    if (step === 7) {
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
    if (step < TOTAL_STEPS) { setStep((s) => s + 1); return; }
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
        lang,
        biologicalSex: quiz.sex!,
        age: parseInt(quiz.age),
        heightCm: parseInt(quiz.height),
        currentWeightKg: parseFloat(quiz.currentWeight),
        sessionDuration: quiz.sessionDuration,
      });
      if (result.error) { setError(result.error); setLoading(false); }
      else if (result.redirectTo) { window.location.href = result.redirectTo; }
      else { setError(tx(T.err_unexpected, lang)); setLoading(false); }
    } catch {
      setError(tx(T.err_network, lang));
      setLoading(false);
    }
  }

  const dayLabels: Record<number, string> = {
    2: tx(T.days2, lang), 3: tx(T.days3, lang), 4: tx(T.days4, lang),
    5: tx(T.days5, lang), 6: tx(T.days6, lang), 7: tx(T.days7, lang),
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col min-h-screen max-w-sm mx-auto w-full px-5">
        {/* Logo + lang toggle */}
        <div className="pt-6 pb-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tighter">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>

        <div className="pb-8">
          <ProgressBar step={step} lang={lang} />
        </div>

        <div className="flex-1">

          {/* STEP 1 — Goal */}
          {step === 1 && (
            <StepWrapper title={tx(T.step1_title, lang)}>
              <OptionCard selected={quiz.goal === "lose_weight"} onClick={() => set("goal", "lose_weight")}
                icon="🔥" label={tx(T.lose_weight, lang)} sub={tx(T.lose_weight_sub, lang)} />
              <OptionCard selected={quiz.goal === "gain_muscle"} onClick={() => set("goal", "gain_muscle")}
                icon="💪" label={tx(T.gain_muscle, lang)} sub={tx(T.gain_muscle_sub, lang)} />
              <OptionCard selected={quiz.goal === "athletic"} onClick={() => set("goal", "athletic")}
                icon="🏃" label={tx(T.athletic, lang)} sub={tx(T.athletic_sub, lang)} />
            </StepWrapper>
          )}

          {/* STEP 2 — Body profile */}
          {step === 2 && (
            <StepWrapper title={tx(T.step2_title, lang)} sub={tx(T.step2_sub, lang)}>
              {/* Sex */}
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">{tx(T.sex_label, lang)}</p>
                <div className="flex gap-2">
                  <SexCard selected={quiz.sex === "male"}   onClick={() => set("sex", "male")}   icon="♂️" label={tx(T.male, lang)} />
                  <SexCard selected={quiz.sex === "female"} onClick={() => set("sex", "female")} icon="♀️" label={tx(T.female, lang)} />
                  <SexCard selected={quiz.sex === "other"}  onClick={() => set("sex", "other")}  icon="⚧" label={tx(T.other, lang)} />
                </div>
              </div>

              {/* Age + Height + Weight */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <NumberInput
                  label={tx(T.age_label, lang)}
                  value={quiz.age} onChange={(v) => set("age", v)}
                  unit={tx(T.age_unit, lang)} placeholder="25" min={10} max={100}
                />
                <NumberInput
                  label={tx(T.height_label, lang)}
                  value={quiz.height} onChange={(v) => set("height", v)}
                  unit="cm" placeholder="175" min={100} max={250}
                />
                <NumberInput
                  label={tx(T.weight_label, lang)}
                  value={quiz.currentWeight} onChange={(v) => set("currentWeight", v)}
                  unit="kg" placeholder="75" min={30} max={300}
                />
              </div>
            </StepWrapper>
          )}

          {/* STEP 3 — Level */}
          {step === 3 && (
            <StepWrapper title={tx(T.step3_title, lang)}>
              <OptionCard selected={quiz.level === "beginner"} onClick={() => set("level", "beginner")}
                icon="🌱" label={tx(T.beginner, lang)} sub={tx(T.beginner_sub, lang)} />
              <OptionCard selected={quiz.level === "intermediate"} onClick={() => set("level", "intermediate")}
                icon="📈" label={tx(T.intermediate, lang)} sub={tx(T.intermediate_sub, lang)} />
              <OptionCard selected={quiz.level === "advanced"} onClick={() => set("level", "advanced")}
                icon="🏆" label={tx(T.advanced, lang)} sub={tx(T.advanced_sub, lang)} />
            </StepWrapper>
          )}

          {/* STEP 4 — Schedule (days + duration) */}
          {step === 4 && (
            <StepWrapper title={tx(T.step4_title, lang)}>
              {/* Days */}
              <div className="space-y-3">
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">{tx(T.days_label, lang)}</p>
                <div className="flex items-center">
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <button key={d} type="button" onClick={() => set("availableDays", d)}
                      className="flex-1 py-5 font-black text-lg transition-all active:scale-95"
                      style={{
                        background: quiz.availableDays === d ? "linear-gradient(135deg,#E8C96B,#C9A84C)" : "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: quiz.availableDays === d ? "#000" : "#71717a",
                        borderRadius: d === 2 ? "1rem 0 0 1rem" : d === 7 ? "0 1rem 1rem 0" : "0",
                        borderLeft: d === 2 ? undefined : "none",
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-center text-zinc-500 text-sm">{dayLabels[quiz.availableDays]}</p>
              </div>

              {/* Duration */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wide">{tx(T.duration_label, lang)}</p>
                <div className="grid grid-cols-4 gap-2">
                  {([30, 45, 60, 90] as const).map((d) => (
                    <button key={d} type="button" onClick={() => set("sessionDuration", d)}
                      className="py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
                      style={{
                        background: quiz.sessionDuration === d ? "linear-gradient(135deg,#E8C96B,#C9A84C)" : "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: quiz.sessionDuration === d ? "#000" : "#71717a",
                      }}>
                      {d === 90 ? "90+" : d}<br />
                      <span className="text-[10px] font-medium opacity-70">min</span>
                    </button>
                  ))}
                </div>
              </div>
            </StepWrapper>
          )}

          {/* STEP 5 — Injuries */}
          {step === 5 && (
            <StepWrapper title={tx(T.step5_title, lang)}>
              <div className="space-y-4">
                {!quiz.noInjuries && (
                  <textarea value={quiz.injuries} onChange={(e) => set("injuries", e.target.value)}
                    placeholder={tx(T.injuries_placeholder, lang)} rows={4}
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-[#C9A84C] transition-colors" />
                )}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => { set("noInjuries", !quiz.noInjuries); if (!quiz.noInjuries) set("injuries", ""); }}
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer"
                    style={{
                      background: quiz.noInjuries ? "linear-gradient(135deg,#E8C96B,#A8893A)" : "transparent",
                      border: quiz.noInjuries ? "none" : "1.5px solid rgba(255,255,255,0.25)",
                    }}>
                    {quiz.noInjuries && <span className="text-black text-[11px] font-black">✓</span>}
                  </div>
                  <span className="text-sm text-zinc-300">{tx(T.no_injuries, lang)}</span>
                </label>
              </div>
            </StepWrapper>
          )}

          {/* STEP 6 — Equipment */}
          {step === 6 && (
            <StepWrapper title={tx(T.step6_title, lang)}>
              <OptionCard selected={quiz.equipment === "gym_full"} onClick={() => set("equipment", "gym_full")}
                icon="🏋️" label={tx(T.gym_full, lang)} sub={tx(T.gym_full_sub, lang)} />
              <OptionCard selected={quiz.equipment === "gym_basic"} onClick={() => set("equipment", "gym_basic")}
                icon="🏃" label={tx(T.gym_basic, lang)} sub={tx(T.gym_basic_sub, lang)} />
              <OptionCard selected={quiz.equipment === "home_weights"} onClick={() => set("equipment", "home_weights")}
                icon="🏠" label={tx(T.home_weights, lang)} sub={tx(T.home_weights_sub, lang)} />
              <OptionCard selected={quiz.equipment === "home_none"} onClick={() => set("equipment", "home_none")}
                icon="🛋️" label={tx(T.home_none, lang)} sub={tx(T.home_none_sub, lang)} />
              <OptionCard selected={quiz.equipment === "outdoor"} onClick={() => set("equipment", "outdoor")}
                icon="🌳" label={tx(T.outdoor, lang)} sub={tx(T.outdoor_sub, lang)} />
            </StepWrapper>
          )}

          {/* STEP 7 — Create account */}
          {step === 7 && (
            <StepWrapper title={tx(T.step7_title, lang)}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{tx(T.full_name, lang)}</label>
                  <input type="text" value={quiz.fullName} onChange={(e) => set("fullName", e.target.value)}
                    placeholder={tx(T.name_ph, lang)} autoComplete="name"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{tx(T.email_lbl, lang)}</label>
                  <input type="email" value={quiz.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="email@example.com" autoComplete="email"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{tx(T.password_lbl, lang)}</label>
                  <input type="password" value={quiz.password} onChange={(e) => set("password", e.target.value)}
                    placeholder={tx(T.password_ph, lang)} autoComplete="new-password"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{tx(T.confirm_pw, lang)}</label>
                  <input type="password" value={quiz.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder={tx(T.confirm_pw_ph, lang)} autoComplete="new-password"
                    className="w-full rounded-2xl px-4 py-3 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C] transition-colors" />
                  {quiz.confirmPassword.length > 0 && quiz.password !== quiz.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{tx(T.pw_mismatch, lang)}</p>
                  )}
                </div>
                <p className="text-zinc-600 text-xs text-center pt-1">
                  {tx(T.terms_pre, lang)}{" "}
                  <Link href="/terms" target="_blank" className="underline hover:text-zinc-400 transition-colors">
                    {tx(T.terms_link, lang)}
                  </Link>
                  {tx(T.terms_post, lang)}
                </p>
              </div>
            </StepWrapper>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="pb-8 pt-4 flex gap-3">
          {step > 1 && (
            <button type="button" onClick={() => { setError(null); setStep((s) => s - 1); }}
              disabled={loading}
              className="flex-none px-5 py-4 rounded-2xl bg-zinc-800 text-zinc-400 text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50">
              {tx(T.back, lang)}
            </button>
          )}
          <button type="button" onClick={handleContinue} disabled={!canContinue() || loading}
            className="flex-1 py-4 rounded-2xl font-bold text-black text-sm transition-all active:scale-95 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {tx(T.processing, lang)}
              </span>
            ) : step === TOTAL_STEPS ? tx(T.start_trial, lang) : tx(T.continue, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
