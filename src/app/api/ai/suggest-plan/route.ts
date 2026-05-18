import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes: string;
}

interface PlanDay {
  day_of_week: number;
  label: string;
  is_rest: boolean;
  exercises: Exercise[];
}

interface SuggestedPlan {
  name: string;
  days: PlanDay[];
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API não configurada." }, { status: 503 });
  }

  // Auth — must be a coach
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = (await req.json()) as { clientId?: string };
  const clientId = body.clientId;
  if (!clientId) {
    return NextResponse.json({ error: "clientId é obrigatório." }, { status: 400 });
  }

  // Verify coach has access to this client
  const { data: accessCheck } = await supabase
    .from("coach_clients")
    .select("client_id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();

  // Also allow access via workout_plans
  const { data: planCheck } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();

  if (!accessCheck && !planCheck) {
    return NextResponse.json({ error: "Sem acesso a este cliente." }, { status: 403 });
  }

  // Fetch onboarding data
  const admin = createAdminClient();
  const { data: onboarding } = await admin
    .from("client_onboarding")
    .select("goal, level, available_days, injuries")
    .eq("client_id", clientId)
    .maybeSingle();

  const { data: clientProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", clientId)
    .single();

  const clientName = clientProfile?.full_name ?? "o atleta";

  // Build prompt
  const goalMap: Record<string, string> = {
    lose_weight: "perder peso e ganhar definição",
    gain_muscle: "ganhar massa muscular",
    maintain: "manter a forma e saúde",
    athletic: "melhorar condição física e resistência",
    health: "melhorar saúde geral",
  };
  const levelMap: Record<string, string> = {
    beginner: "iniciante (menos de 6 meses)",
    intermediate: "intermédio (6 meses a 2 anos)",
    advanced: "avançado (mais de 2 anos)",
  };

  const goal = goalMap[onboarding?.goal ?? ""] ?? "melhorar condição física";
  const level = levelMap[onboarding?.level ?? ""] ?? "intermédio";
  const days = Array.isArray(onboarding?.available_days)
    ? (onboarding.available_days as number[]).length
    : 3;
  const injuries = onboarding?.injuries || "sem lesões conhecidas";

  const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  const prompt = `És um coach de fitness experiente. Cria um plano de treino semanal personalizado para um cliente chamado ${clientName}.

Dados do cliente:
- Objetivo: ${goal}
- Nível: ${level}
- Dias disponíveis por semana: ${days}
- Lesões/limitações: ${injuries}

Regras:
- O plano deve ter exatamente 7 dias (day_of_week de 0 a 6, onde 0=Segunda, 6=Domingo).
- Distribuir os ${days} dias de treino de forma equilibrada; os restantes dias são descanso (is_rest: true, sem exercícios).
- Cada dia de treino deve ter entre 4 e 7 exercícios.
- Para cada exercício: name (nome em português), sets (número de séries, inteiro), reps (ex: "8-12" ou "15" ou "30 segundos"), notes (nota curta ou string vazia).
- O nome do plano deve refletir o objetivo.
- Adapta a intensidade e exercícios ao nível do cliente.
- Evita exercícios que agravem as lesões mencionadas.

Responde APENAS com um objeto JSON válido no seguinte formato (sem markdown, sem texto extra):
{
  "name": "Nome do Plano",
  "days": [
    {
      "day_of_week": 0,
      "label": "${dayNames[0]}",
      "is_rest": false,
      "exercises": [
        { "name": "Nome do exercício", "sets": 3, "reps": "8-12", "notes": "" }
      ]
    }
  ]
}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return NextResponse.json({ error: "Erro ao contactar a IA." }, { status: 502 });
    }

    const groqData = (await groqRes.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = groqData.choices?.[0]?.message?.content ?? "{}";

    let plan: SuggestedPlan;
    try {
      plan = JSON.parse(content) as SuggestedPlan;
    } catch {
      console.error("Failed to parse Groq JSON:", content);
      return NextResponse.json({ error: "A IA devolveu uma resposta inválida." }, { status: 502 });
    }

    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
