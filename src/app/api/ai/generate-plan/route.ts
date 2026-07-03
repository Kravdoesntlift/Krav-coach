import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Groq from "groq-sdk";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`plan:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { clientId } = await req.json() as { clientId: string };

  // Verify caller is coach of this client
  const { data: rel } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!rel) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [{ data: onboarding }, { data: profile }] = await Promise.all([
    admin.from("client_onboarding").select("*").eq("client_id", clientId).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", clientId).maybeSingle(),
  ]);

  const clientName = profile?.full_name ?? "Cliente";
  const level      = onboarding?.fitness_level ?? "intermediate";
  const goals      = onboarding?.goals_text ?? "Melhorar a condição física geral";
  const injuries   = onboarding?.injuries ?? null;
  const days       = onboarding?.availability ?? 3;
  const equipment  = onboarding?.equipment ?? "Ginásio completo";

  const prompt = `És um personal trainer experiente a criar um plano de treino semanal personalizado.

DADOS DO CLIENTE:
- Nome: ${clientName}
- Nível: ${level}
- Objetivo: ${goals}
- Lesões/limitações: ${injuries ?? "nenhuma"}
- Dias disponíveis: ${days} dias por semana
- Equipamento: ${equipment}

Cria um plano de treino semanal completo. Responde APENAS em JSON válido com este formato exato (sem markdown, sem texto extra):

{
  "name": "nome do plano",
  "days": [
    {
      "day_of_week": 1,
      "label": "Peito & Tríceps",
      "is_rest": false,
      "exercises": [
        { "name": "Supino Plano", "sets": 4, "reps": 10, "notes": "Foco na contração" }
      ]
    },
    {
      "day_of_week": 3,
      "label": "Descanso",
      "is_rest": true,
      "exercises": []
    }
  ]
}

Regras:
- Usa exatamente ${days} dias de treino (os restantes são descanso, distribuídos de forma inteligente)
- day_of_week: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
- Adapta os exercícios ao nível e equipamento disponível
- Evita exercícios que agravem as lesões indicadas
- Para iniciante: 3 séries, 12-15 reps, exercícios básicos
- Para intermédio: 3-4 séries, 8-12 reps, maior variedade
- Para avançado: 4-5 séries, 5-12 reps, técnicas avançadas
- Inclui notas úteis nos exercícios (tempo de execução, dica técnica)
- Responde sempre em português de Portugal`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurada — vai a console.groq.com e cria uma key grátis" }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "És um personal trainer experiente. Respondes SEMPRE com JSON válido, sem markdown, sem texto adicional.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "IA não devolveu JSON válido" }, { status: 500 });

    const raw_plan = JSON.parse(jsonMatch[0]) as {
      name: string;
      days: {
        day_of_week: number;
        label: string;
        is_rest: boolean;
        exercises: { name: string; sets: number; reps: number | string; notes?: string }[];
      }[];
    };

    // Normalise reps to string (AI sometimes returns number, DB expects text)
    const plan = {
      ...raw_plan,
      days: (raw_plan.days ?? []).map((d) => ({
        ...d,
        exercises: (d.exercises ?? []).map((e) => ({
          ...e,
          reps: String(e.reps),
        })),
      })),
    };

    return NextResponse.json({ plan });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message ?? "Erro ao gerar plano" }, { status: 500 });
  }
}
