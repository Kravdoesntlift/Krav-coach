import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!checkRateLimit(`chat:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { message, history: rawHistory } = await req.json() as {
    message: string;
    history: { role: string; content: string }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 400 });

  // Validate and sanitize history — only allow known roles, cap content length
  const history = (Array.isArray(rawHistory) ? rawHistory : [])
    .filter((h) => h.role === "user" || h.role === "assistant")
    .map((h) => ({ role: h.role as "user" | "assistant", content: String(h.content).slice(0, 2000) }))
    .slice(-10);

  const admin = createAdminClient();

  const [
    { data: profile },
    { data: onboarding },
    { data: plans },
    { data: lastCheckin },
  ] = await Promise.all([
    admin.from("profiles").select("full_name, lang").eq("id", user.id).maybeSingle(),
    admin.from("client_onboarding").select("*").eq("client_id", user.id).maybeSingle(),
    admin.from("workout_plans")
      .select("name, week_start, workout_days(label, is_rest, exercises(name, sets, reps, notes))")
      .eq("client_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1),
    admin.from("weekly_checkins")
      .select("weight_kg, energy_level, notes, week_start")
      .eq("client_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1),
  ]);

  const lang: "pt" | "en" = profile?.lang === "en" ? "en" : "pt";
  const isEN = lang === "en";

  const clientName = profile?.full_name?.split(" ")[0] ?? (isEN ? "Client" : "Cliente");
  const currentPlan = plans?.[0];
  const checkin = lastCheckin?.[0];

  const planSummary = currentPlan
    ? isEN
      ? `Current plan: "${currentPlan.name}" (week of ${currentPlan.week_start}).\nTraining days:\n${
          (currentPlan.workout_days as { label: string; is_rest: boolean; exercises: { name: string; sets: number; reps: string }[] }[])
            ?.filter((d) => !d.is_rest)
            .map((d) => `- ${d.label}: ${d.exercises?.map((e) => `${e.name} (${e.sets}x${e.reps})`).join(", ")}`)
            .join("\n")
        }`
      : `Plano atual: "${currentPlan.name}" (semana de ${currentPlan.week_start}).\nDias de treino:\n${
          (currentPlan.workout_days as { label: string; is_rest: boolean; exercises: { name: string; sets: number; reps: string }[] }[])
            ?.filter((d) => !d.is_rest)
            .map((d) => `- ${d.label}: ${d.exercises?.map((e) => `${e.name} (${e.sets}x${e.reps})`).join(", ")}`)
            .join("\n")
        }`
    : isEN ? "No training plan assigned yet." : "Sem plano de treino atribuído ainda.";

  const checkinSummary = checkin
    ? isEN
      ? `Last check-in: ${checkin.week_start} | Weight: ${checkin.weight_kg ?? "—"}kg | Energy: ${checkin.energy_level ?? "—"}/5 | Note: "${checkin.notes ?? "none"}"`
      : `Último check-in: ${checkin.week_start} | Peso: ${checkin.weight_kg ?? "—"}kg | Energia: ${checkin.energy_level ?? "—"}/5 | Nota: "${checkin.notes ?? "nenhuma"}"`
    : isEN ? "No check-ins logged yet." : "Sem check-ins registados ainda.";

  const systemPrompt = isEN
    ? `You are the personal coaching assistant for KRAV Coaching. You are talking with ${clientName}.

CLIENT CONTEXT:
- Level: ${onboarding?.fitness_level ?? "not defined"}
- Goal: ${onboarding?.goals_text ?? "not defined"}
- Injuries/limitations: ${onboarding?.injuries ?? "none"}
- Equipment: ${onboarding?.equipment ?? "full gym"}
- ${planSummary}
- ${checkinSummary}

HOW TO RESPOND:
- Always reply in English, informal and motivating tone
- Be specific and practical — give concrete advice, not vague generalities
- Use the client's plan and history to personalise your response
- For exercise substitutions, suggest alternatives suited to their level and equipment
- For nutrition questions, give general guidance and note that the coach can provide a personalised plan
- Keep responses short (max 3-4 paragraphs) unless the client asks for more detail
- Never make medical diagnoses or prescribe medications
- If you don't know something specific about the client, suggest they ask the coach in the main chat`
    : `És o assistente de coaching pessoal da KRAV Coaching. Estás a falar com ${clientName}.

CONTEXTO DO CLIENTE:
- Nível: ${onboarding?.fitness_level ?? "não definido"}
- Objetivo: ${onboarding?.goals_text ?? "não definido"}
- Lesões/limitações: ${onboarding?.injuries ?? "nenhuma"}
- Equipamento: ${onboarding?.equipment ?? "ginásio completo"}
- ${planSummary}
- ${checkinSummary}

COMO RESPONDER:
- Responde sempre em português de Portugal, informal e motivador
- Sê específico e prático — dá conselhos concretos, não vaguidades
- Usa o plano e o histórico do cliente para personalizar a resposta
- Se perguntarem sobre substituições de exercícios, sugere alternativas adequadas ao nível e equipamento
- Se perguntarem sobre nutrição, dá orientações gerais mas recorda que o coach pode dar um plano personalizado
- Mantém as respostas curtas (máx 3-4 parágrafos) a não ser que o cliente peça mais detalhe
- Nunca faças diagnósticos médicos nem receitas de medicamentos
- Se não souberes algo específico do cliente, pede ao coach no chat principal`;

  const Groq = (await import("groq-sdk")).default;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3-32b",
    max_tokens: 1024,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ],
  });

  const fallback = isEN ? "Could not get a reply. Please try again." : "Não consegui responder. Tenta novamente.";
  const reply = completion.choices[0]?.message?.content?.trim() ?? fallback;

  return NextResponse.json({ reply });
}
