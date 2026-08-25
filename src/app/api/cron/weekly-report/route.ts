import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signPhotoUrls } from "@/lib/storage";
import { sendPushToUser } from "@/lib/push";

export async function GET(req: NextRequest) {
  // Fail-closed: CRON_SECRET required
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Week that just ended (Mon–Sun)
  const today = new Date();
  const dow = today.getUTCDay(); // 0=Sun
  const mon = new Date(today);
  mon.setUTCDate(today.getUTCDate() - ((dow + 6) % 7));
  const weekStart = mon.toISOString().split("T")[0];

  // Get all coach-client relationships with active clients
  const { data: relationships } = await admin
    .from("coach_clients")
    .select("coach_id, client_id, profiles!client_id(full_name, status)")
    .eq("assigned_role", "coach");

  if (!relationships?.length) return NextResponse.json({ ok: true, processed: 0 });

  const active = relationships.filter((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return (profile as { status?: string } | null)?.status === "active";
  });

  let processed = 0;
  const errors: string[] = [];

  for (const rel of active) {
    try {
      const clientId = rel.client_id as string;
      const coachId = rel.coach_id as string;

      // Fetch plan IDs for this week first (needed for workout_days query)
      const { data: weekPlans } = await admin
        .from("workout_plans")
        .select("id")
        .eq("client_id", clientId)
        .eq("week_start", weekStart);

      const planIds = weekPlans?.map((p) => p.id) ?? [];

      // Fetch data in parallel
      const [
        { data: checkin },
        { data: prevCheckin },
        { data: completions },
        { data: planDays },
        { data: coachProfile },
        { data: clientProfile },
        { data: photos },
        { data: feedback },
      ] = await Promise.all([
        // This week's check-in
        admin.from("weekly_checkins").select("weight_kg, waist_cm, chest_cm, arm_cm, energy_level")
          .eq("client_id", clientId).eq("week_start", weekStart).maybeSingle(),
        // Previous week's check-in for delta
        admin.from("weekly_checkins").select("weight_kg, waist_cm")
          .eq("client_id", clientId).neq("week_start", weekStart)
          .order("week_start", { ascending: false }).limit(1).maybeSingle(),
        // Workout completions this week (Mon–Sun only)
        admin.from("workout_completions").select("id, day_id")
          .eq("client_id", clientId)
          .gte("completed_at", weekStart)
          .lt("completed_at", new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString().split("T")[0]),
        // Total workout days in plan for this week
        planIds.length > 0
          ? admin.from("workout_days").select("id, is_rest").in("plan_id", planIds)
          : Promise.resolve({ data: [] as { id: string; is_rest: boolean | null }[], error: null }),
        // Coach name
        admin.from("profiles").select("full_name").eq("id", coachId).single(),
        // Client name + lang
        admin.from("profiles").select("full_name, lang").eq("id", clientId).single(),
        // Progress photos (front angle, oldest + newest)
        admin.from("progress_photos").select("photo_url, taken_at, angle")
          .eq("client_id", clientId)
          .in("angle", ["front"])
          .order("taken_at", { ascending: true }),
        // Coach feedback for this week
        admin.from("coach_feedback").select("message")
          .eq("client_id", clientId).eq("coach_id", coachId).eq("week_start", weekStart).maybeSingle(),
      ]);

      // Calculate metrics
      const workoutsTotal = (planDays ?? []).filter((d) => !d.is_rest).length;
      const workoutsCompleted = completions?.length ?? 0;
      const weightKg = checkin?.weight_kg ?? null;
      const weightChange =
        checkin?.weight_kg != null && prevCheckin?.weight_kg != null
          ? Math.round((checkin.weight_kg - prevCheckin.weight_kg) * 10) / 10
          : null;
      const waistCm = checkin?.waist_cm ?? null;
      const waistChange =
        checkin?.waist_cm != null && prevCheckin?.waist_cm != null
          ? Math.round((checkin.waist_cm - prevCheckin.waist_cm) * 10) / 10
          : null;
      const energyAvg = checkin?.energy_level ?? null;

      // Photos: oldest front vs newest front.
      // The bucket is private, so these have to be signed. Seven days: long
      // enough to open the email at leisure, short enough that the link is dead
      // before the next report goes out. Email is not a channel to hold a
      // long-lived link to someone's progress photos.
      const frontPhotos = (photos ?? []) as { photo_url: string; taken_at: string; angle: string }[];
      const signedFront = await signPhotoUrls(frontPhotos, 60 * 60 * 24 * 7);
      const photoBeforeUrl = signedFront[0]?.photo_url ?? null;
      const photoLatestUrl = signedFront[signedFront.length - 1]?.photo_url ?? null;
      const hasNewPhoto = photoLatestUrl && photoBeforeUrl !== photoLatestUrl;

      const coachFirstName = ((coachProfile?.full_name as string | undefined) ?? "").split(" ")[0] || "Coach";
      const isEN = (clientProfile as { lang?: string } | null)?.lang === "en";
      const clientFirstName = ((clientProfile?.full_name as string | undefined) ?? "").split(" ")[0] || (isEN ? "athlete" : "atleta");

      // Generate AI message with Groq
      let aiMessage: string | null = (feedback?.message as string | undefined) ?? null;
      if (!aiMessage && process.env.GROQ_API_KEY) {
        const prompt = isEN
          ? `You are ${coachFirstName}, a personal trainer. Write a short motivational message (2-3 sentences, max 120 words) in English for your client ${clientFirstName} based on this week's results:
- Workouts completed: ${workoutsCompleted} of ${workoutsTotal}
${weightChange != null ? `- Weight: ${weightChange > 0 ? "+" : ""}${weightChange}kg vs last week` : ""}
${waistChange != null ? `- Waist: ${waistChange > 0 ? "+" : ""}${waistChange}cm vs last week` : ""}
${energyAvg != null ? `- Average energy: ${energyAvg}/5` : ""}
Use a direct, encouraging and personal tone. NO emojis. Speak in first person as coach.`
          : `És ${coachFirstName}, personal trainer. Escreve uma mensagem de motivação curta (2-3 frases, máximo 120 palavras) em português de Portugal para o teu cliente ${clientFirstName} com base nos resultados desta semana:
- Treinos completados: ${workoutsCompleted} de ${workoutsTotal}
${weightChange != null ? `- Peso: ${weightChange > 0 ? "+" : ""}${weightChange}kg face à semana anterior` : ""}
${waistChange != null ? `- Cintura: ${waistChange > 0 ? "+" : ""}${waistChange}cm face à semana anterior` : ""}
${energyAvg != null ? `- Energia média: ${energyAvg}/5` : ""}
Usa um tom direto, encorajador e pessoal. NÃO uses emojis. Fala na primeira pessoa como coach.`;

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "qwen/qwen3-32b",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 150,
              temperature: 0.7,
            }),
          });
          const groqData = await groqRes.json() as {
            choices?: { message?: { content?: string } }[];
          };
          const rawMsg = groqData.choices?.[0]?.message?.content?.trim() ?? null;
          aiMessage = rawMsg ? rawMsg.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim() || null : null;
        } catch (e) {
          console.error("[weekly-report] Groq error:", e);
        }
      }

      // Upsert report
      await admin.from("weekly_reports").upsert(
        {
          client_id: clientId,
          coach_id: coachId,
          week_start: weekStart,
          workouts_completed: workoutsCompleted,
          workouts_total: workoutsTotal,
          weight_kg: weightKg,
          weight_change: weightChange,
          waist_cm: waistCm,
          waist_change: waistChange,
          energy_avg: energyAvg,
          ai_message: aiMessage,
          photo_before_url: photoBeforeUrl,
          photo_latest_url: hasNewPhoto ? photoLatestUrl : null,
        },
        { onConflict: "client_id,week_start" }
      );

      // Push notification
      await sendPushToUser(
        clientId,
        "O teu relatório semanal está pronto!",
        `${coachFirstName} analisou a tua semana. Vê os teus resultados agora.`,
        "/client/weekly-report",
      ).catch(() => {});

      processed++;
    } catch (err) {
      errors.push(`${rel.client_id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, processed, errors });
}
