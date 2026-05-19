import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI não configurada." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { message, history } = await req.json() as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const admin = createAdminClient();

  // Gather client context
  const [
    { data: profile },
    { data: onboarding },
    { data: plans },
    { data: lastCheckin },
  ] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
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

  const clientName = profile?.full_name?.split(" ")[0] ?? "Cliente";
  const currentPlan = plans?.[0];
  const checkin = lastCheckin?.[0];

  const planSummary = currentPlan
    ? `Plano atual: "${currentPlan.name}" (semana de ${currentPlan.week_start}).\nDias de treino:\n${
        (currentPlan.workout_days as { label: string; is_rest: boolean; exercises: { name: string; sets: number; reps: string }[] }[])
          ?.filter((d) => !d.is_rest)
          .map((d) => `- ${d.label}: ${d.exercises?.map((e) => `${e.name} (${e.sets}x${e.reps})`).join(", ")}`)
          .join("\n")
      }`
    : "Sem plano de treino atribuído ainda.";

  const checkinSummary = checkin
    ? `Último check-in: ${checkin.week_start} | Peso: ${checkin.weight_kg ?? "—"}kg | Energia: ${checkin.energy_level ?? "—"}/5 | Nota: "${checkin.notes ?? "nenhuma"}"`
    : "Sem check-ins registados ainda.";

  const systemPrompt = `És o assistente de coaching pessoal da KRAV Coaching. Estás a falar com ${clientName}.

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
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      ...history.slice(-10),
      { role: "user", content: message },
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim() ?? "Não consegui responder. Tenta novamente.";

  return NextResponse.json({ reply });
}
