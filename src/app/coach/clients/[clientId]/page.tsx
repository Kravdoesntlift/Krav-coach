import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DAY_NAMES_FULL } from "@/lib/supabase/types";
import { deletePlan, duplicatePlan } from "@/app/coach/plans/actions";
import DeletePlanButton from "@/components/coach/DeletePlanButton";
import DuplicatePlanButton from "@/components/coach/DuplicatePlanButton";
import CreateProgramButton from "@/components/coach/CreateProgramButton";
import FeedbackForm from "@/components/coach/FeedbackForm";
import CoachNotes from "@/components/coach/CoachNotes";
import ClientStatusForm from "@/components/coach/ClientStatusForm";
import RefundAndCancelButton from "@/components/coach/RefundAndCancelButton";
import ChallengeForm from "@/components/coach/ChallengeForm";
import GoalForm from "@/components/coach/GoalForm";
import NotifyButton from "@/components/coach/NotifyButton";
import MacroGoalsCoach from "@/components/coach/MacroGoalsCoach";
import Image from "next/image";
import PhotoLightbox from "@/components/coach/PhotoLightbox";
import type { ClientStatus } from "@/lib/supabase/types";

const ENERGY_LABELS: Record<number, string> = {
  1: "Muito baixa",
  2: "Baixa",
  3: "Normal",
  4: "Alta",
  5: "Muito alta",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // Verify this coach owns the client before exposing any data (prevents IDOR)
  const { data: rel } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("coach_id", user.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!rel) notFound();

  const { data: client } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) notFound();

  const { data: plans } = await supabase
    .from("workout_plans")
    .select(`*, workout_days(*, exercises(*), workout_completions(*))`)
    .eq("coach_id", user!.id)
    .eq("client_id", clientId)
    .order("week_start", { ascending: false });

  const { data: checkins } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false })
    .limit(8);

  // Current week feedback — pure UTC to match client dashboard
  const today = new Date();
  const dow = today.getUTCDay();
  const mon = new Date(today);
  mon.setUTCDate(today.getUTCDate() - ((dow + 6) % 7));
  const currentWeekStart = mon.toISOString().split("T")[0];

  const weekEndDate = new Date(mon);
  weekEndDate.setUTCDate(mon.getUTCDate() + 6);
  const currentWeekEnd = weekEndDate.toISOString().split("T")[0];

  const admin = createAdminClient();
  const [{ data: feedbackRow }, { data: coachNote }, { data: clientPRs }, { data: onboarding }, { data: challenges }, { data: goals }, { data: progressPhotos }, { data: nutritionLogs }] = await Promise.all([
    supabase.from("coach_feedback").select("message")
      .eq("coach_id", user!.id).eq("client_id", clientId).eq("week_start", currentWeekStart).maybeSingle(),
    supabase.from("coach_notes").select("content")
      .eq("coach_id", user!.id).eq("client_id", clientId).maybeSingle(),
    supabase.from("personal_records").select("*")
      .eq("client_id", clientId).order("recorded_at", { ascending: false }),
    admin.from("client_onboarding").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("challenges").select("*")
      .eq("coach_id", user!.id).eq("client_id", clientId).eq("week_start", currentWeekStart),
    supabase.from("client_goals").select("*")
      .eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("progress_photos").select("*")
      .eq("client_id", clientId).order("taken_at", { ascending: false }),
    admin.from("nutrition_logs").select("logged_at,calories,protein_g,carbs_g,fat_g,meal_name")
      .eq("client_id", clientId)
      .gte("logged_at", currentWeekStart)
      .lte("logged_at", currentWeekEnd)
      .order("logged_at", { ascending: true }),
  ]);

  // Attention alert: no check-in in last 2 weeks
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastCheckin = checkins?.[0];
  const needsAttention = !lastCheckin || new Date(lastCheckin.week_start) < twoWeeksAgo;

  // Trial badge
  let trialDaysLeft: number | null = null;
  if (client.trial_ends_at) {
    const msLeft = new Date(client.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.ceil(msLeft / 86_400_000);
  }

  // Group PRs by exercise
  const prMap = new Map<string, { weight_kg: number | null; reps: number | null }>();
  for (const pr of clientPRs ?? []) {
    if (!prMap.has(pr.exercise_name)) {
      prMap.set(pr.exercise_name, { weight_kg: pr.weight_kg, reps: pr.reps });
    }
  }

  // Nutrition: aggregate by day for this week
  type NLog = { logged_at: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; meal_name: string };
  const nutritionByDay = new Map<string, NLog[]>();
  for (const log of (nutritionLogs ?? []) as NLog[]) {
    if (!nutritionByDay.has(log.logged_at)) nutritionByDay.set(log.logged_at, []);
    nutritionByDay.get(log.logged_at)!.push(log);
  }
  const nutritionDays = [...nutritionByDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  const totalNutritionLogs = nutritionLogs?.length ?? 0;

  return (
    <div className="space-y-10 page-enter">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/coach/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
          &larr; Clientes
        </Link>
        <div className="w-px h-4 bg-zinc-700" />
        <div className="flex items-center gap-3">
          {client.avatar_url ? (
            <Image
              src={client.avatar_url}
              alt={client.full_name}
              width={40}
              height={40}
              className="rounded-full object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0">
              {client.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-bold text-white">{client.full_name}</h1>
          {trialDaysLeft !== null && (
            trialDaysLeft > 0
              ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30">Trial · {trialDaysLeft}d</span>
              : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Trial expirado</span>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/coach/clients/${clientId}/chat`}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors"
          >
            💬 Chat
          </Link>
          <Link
            href={`/coach/clients/${clientId}/report`}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm transition-colors"
          >
            📄 Relatório
          </Link>
          <NotifyButton clientId={clientId} />
          <Link
            href={`/coach/plans/new?client=${clientId}`}
            className="btn-primary text-sm"
          >
            + Novo Plano
          </Link>
        </div>
      </div>

      {/* Attention alert */}
      {needsAttention && (
        <div className="border border-yellow-700/50 bg-yellow-950/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-lg shrink-0">⚠</span>
          <div>
            <p className="text-yellow-300 text-sm font-semibold">Cliente sem check-in recente</p>
            <p className="text-yellow-600 text-xs mt-0.5">
              {lastCheckin
                ? `Último check-in em ${new Date(lastCheckin.week_start + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}`
                : "Ainda não fez nenhum check-in"}
              . Considera enviar uma mensagem de motivação.
            </p>
          </div>
        </div>
      )}

      {/* Status & Subscription */}
      <section>
        <h2 className="text-white font-semibold mb-3">Estado da Subscrição</h2>
        <div className="card p-5 space-y-4">
          <ClientStatusForm
            clientId={clientId}
            currentStatus={(client.status ?? "active") as ClientStatus}
            renewsAt={client.subscription_renews_at ?? null}
          />
          {client.status !== "cancelled" && (
            <RefundAndCancelButton
              clientId={clientId}
              clientName={client.full_name ?? "Cliente"}
            />
          )}
        </div>
      </section>

      {/* Onboarding data */}
      {onboarding && (
        <section>
          <h2 className="text-white font-semibold mb-3">Perfil do Cliente</h2>
          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(onboarding.fitness_level ?? (onboarding as Record<string,unknown>).level) && (
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nível</p>
                  <p className="text-white text-sm font-semibold capitalize">
                    {onboarding.fitness_level ?? (onboarding as Record<string,unknown>).level as string}
                  </p>
                </div>
              )}
              {onboarding.availability && (
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Disponibilidade</p>
                  <p className="text-white text-sm font-semibold">{onboarding.availability} dias/sem</p>
                </div>
              )}
              {onboarding.equipment && (
                <div className="bg-zinc-800/60 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Equipamento</p>
                  <p className="text-white text-sm font-semibold">{onboarding.equipment}</p>
                </div>
              )}
            </div>
            {(onboarding.goals_text ?? (onboarding as Record<string,unknown>).goal) && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Objetivo</p>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {onboarding.goals_text ?? String((onboarding as Record<string,unknown>).goal ?? "").replace("_", " ")}
                </p>
              </div>
            )}
            {onboarding.injuries && (
              <div>
                <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider mb-1.5">⚠ Lesões / Limitações</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{onboarding.injuries}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Goals */}
      <section>
        <div className="card p-5">
          <GoalForm clientId={clientId} initialGoals={(goals ?? []) as Parameters<typeof GoalForm>[0]["initialGoals"]} />
        </div>
      </section>

      {/* Macro goals — coach sets precision nutrition targets for this client */}
      <MacroGoalsCoach clientId={clientId} />

      {/* Coach notes (private) */}
      <CoachNotes coachId={user!.id} clientId={clientId} existing={coachNote?.content ?? null} />

      {/* PRs do cliente */}
      {prMap.size > 0 && (
        <section>
          <h2 className="text-white font-semibold mb-3">Recordes Pessoais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from(prMap.entries()).map(([name, pr]) => (
              <div key={name} className="card p-3">
                <p className="text-gray-400 text-xs truncate mb-1">{name}</p>
                <p className="text-white font-bold">
                  {pr.weight_kg ? `${pr.weight_kg} kg` : "—"}
                  {pr.reps ? <span className="text-gray-500 font-normal text-xs ml-1">× {pr.reps}</span> : null}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Progress photos */}
      <section id="fotos">
        <h2 className="text-white font-semibold mb-3">
          Fotos de Progresso
          {progressPhotos && progressPhotos.length > 0 && (
            <span className="ml-2 text-xs font-normal text-zinc-500">{progressPhotos.length} foto{progressPhotos.length !== 1 ? "s" : ""}</span>
          )}
        </h2>
        {!progressPhotos || progressPhotos.length === 0 ? (
          <p className="text-zinc-600 text-sm">O cliente ainda não submeteu fotos de progresso.</p>
        ) : (
          <PhotoLightbox
            photos={progressPhotos.map((p) => ({
              id: p.id,
              photo_url: p.photo_url,
              caption: (p as Record<string, unknown>).angle
                ? `${String((p as Record<string, unknown>).angle) === "front" ? "Frente" : String((p as Record<string, unknown>).angle) === "side" ? "Lado" : "Costas"}${p.caption ? ` · ${p.caption}` : ""}`
                : (p.caption ?? null),
              taken_at: p.taken_at,
            }))}
          />
        )}
      </section>

      {/* Check-ins */}
      <section>
        <h2 className="text-white font-semibold mb-4">Check-ins Semanais</h2>
        {!checkins?.length ? (
          <p className="text-gray-500 text-sm">Sem check-ins ainda.</p>
        ) : (
          <div className="grid gap-3">
            {checkins.map((c) => (
              <div key={c.id} className="card p-4 flex items-start gap-6 flex-wrap">
                <div className="shrink-0">
                  <p className="text-xs text-gray-500">Semana de</p>
                  <p className="text-white text-sm font-medium mt-0.5">
                    {new Date(c.week_start + "T00:00:00").toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                {c.weight_kg && (
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500">Peso</p>
                    <p className="text-white text-sm font-medium mt-0.5">{c.weight_kg} kg</p>
                  </div>
                )}
                {c.energy_level && (
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500">Energia</p>
                    <p className="text-sm font-medium mt-0.5">
                      <span className="text-brand-gold">{c.energy_level}/5</span>
                      <span className="text-gray-400 ml-1 text-xs">{ENERGY_LABELS[c.energy_level]}</span>
                    </p>
                  </div>
                )}
                {c.notes && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Notas</p>
                    <p className="text-gray-300 text-sm mt-0.5 line-clamp-2">{c.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Weekly feedback */}
      <section>
        <h2 className="text-white font-semibold mb-4">Feedback desta semana</h2>
        <div className="card p-5">
          <FeedbackForm
            coachId={user!.id}
            clientId={clientId}
            weekStart={currentWeekStart}
            existing={feedbackRow?.message ?? null}
          />
        </div>
      </section>

      {/* Weekly challenges */}
      <section>
        <h2 className="text-white font-semibold mb-4">Desafios desta semana</h2>
        <div className="card p-5">
          <ChallengeForm
            coachId={user!.id}
            clientId={clientId}
            weekStart={currentWeekStart}
            existing={challenges ?? []}
          />
        </div>
      </section>

      {/* Plans */}
      <section>
        <h2 className="text-white font-semibold mb-4">Planos de Treino</h2>
        {!plans?.length ? (
          <p className="text-gray-500 text-sm">Sem planos atribuídos.</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const days = plan.workout_days ?? [];
              const totalDays = days.length;
              const completedDays = days.filter((d: { workout_completions?: { client_id: string }[] }) =>
                d.workout_completions?.some((c) => c.client_id === clientId)
              ).length;

              return (
                <div key={plan.id} className="card p-5">
                  {/* Plan header */}
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <h3 className="text-white font-semibold">{plan.name}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Semana de{" "}
                        {new Date(plan.week_start + "T00:00:00").toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-brand-gold font-bold text-lg leading-none">
                          {completedDays}/{totalDays}
                        </p>
                        <p className="text-gray-500 text-xs">treinos</p>
                      </div>
                    </div>
                  </div>

                  {/* Days list */}
                  <div className="space-y-1.5 mb-4">
                    {[...days]
                      .sort((a: { day_of_week: number }, b: { day_of_week: number }) => a.day_of_week - b.day_of_week)
                      .map((day: { id: string; day_of_week: number; label: string | null; is_rest?: boolean; exercises?: { id: string }[]; workout_completions?: { client_id: string; feeling?: string | null; note?: string | null }[] }) => {
                        const completion = day.workout_completions?.find((c) => c.client_id === clientId);
                        const done = !!completion;
                        return (
                          <div key={day.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${done ? "bg-green-500" : "bg-zinc-700"}`} />
                              <span className="text-sm text-gray-300 shrink-0">
                                {DAY_NAMES_FULL[day.day_of_week]}
                                {day.label && (
                                  <span className="text-gray-500 ml-2 text-xs">{day.label}</span>
                                )}
                              </span>
                              {done && completion?.feeling && (
                                <span className="text-base" title={completion.note ?? undefined}>
                                  {completion.feeling}
                                </span>
                              )}
                              {done && completion?.note && (
                                <span className="text-gray-500 text-xs truncate">{completion.note}</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 shrink-0 ml-2">{day.is_rest ? "descanso" : `${day.exercises?.length ?? 0} exerc.`}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                    <Link
                      href={`/coach/plans/${plan.id}/edit`}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Editar
                    </Link>
                    <DuplicatePlanButton planId={plan.id} duplicatePlan={duplicatePlan} />
                    <CreateProgramButton planId={plan.id} />
                    <div className="ml-auto">
                      <DeletePlanButton
                        planId={plan.id}
                        clientId={clientId}
                        deletePlan={deletePlan}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Nutrition this week ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base">Nutrição — esta semana</h2>
          {totalNutritionLogs > 0 && (
            <span className="text-zinc-500 text-xs">{totalNutritionLogs} registos</span>
          )}
        </div>

        {totalNutritionLogs === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "rgba(18,18,20,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-zinc-600 text-sm">Sem registos de nutrição esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nutritionDays.map(([date, logs]) => {
              const cal  = logs.reduce((s, l) => s + (l.calories  ?? 0), 0);
              const prot = logs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
              const carb = logs.reduce((s, l) => s + (l.carbs_g   ?? 0), 0);
              const fat  = logs.reduce((s, l) => s + (l.fat_g     ?? 0), 0);
              const fmtDate = new Date(date + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div
                  key={date}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: "rgba(18,18,20,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-semibold capitalize">{fmtDate}</p>
                    <div className="flex gap-3 text-xs">
                      {cal  > 0 && <span className="text-brand-gold font-semibold">{cal} kcal</span>}
                      {prot > 0 && <span className="text-blue-400">{prot}g P</span>}
                      {carb > 0 && <span className="text-orange-400">{carb}g H</span>}
                      {fat  > 0 && <span className="text-pink-400">{fat}g G</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {logs.map((l, i) => (
                      <span
                        key={i}
                        className="text-xs text-zinc-400 px-2 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {l.meal_name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
