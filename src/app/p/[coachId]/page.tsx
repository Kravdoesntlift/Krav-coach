import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CoachPublicPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  const admin = createAdminClient();

  const { data: coach } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, tagline, role")
    .eq("id", coachId)
    .eq("role", "coach")
    .maybeSingle();

  if (!coach) notFound();

  // Stats: number of active clients + total workout completions
  const { data: plans } = await admin
    .from("workout_plans")
    .select("client_id")
    .eq("coach_id", coachId);

  const clientIds = [...new Set((plans ?? []).map((p) => p.client_id))];
  const clientCount = clientIds.length;

  const { count: completionCount } = await admin
    .from("workout_completions")
    .select("id", { count: "exact", head: true })
    .in("client_id", clientIds.length > 0 ? clientIds : ["none"]);

  const initials = coach.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  // Public transformations
  const { data: transformations } = await admin
    .from("client_transformations")
    .select("*")
    .eq("coach_id", coachId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  // Public testimonials
  const { data: testimonials } = await admin
    .from("testimonials")
    .select("display_name, content, result_highlight, duration_weeks")
    .eq("coach_id", coachId)
    .eq("is_public", true)
    .order("submitted_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,168,76,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-lg mx-auto px-5 py-16 space-y-12">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-black tracking-tighter">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </span>
        </div>

        {/* Coach hero */}
        <div className="flex flex-col items-center text-center gap-5">
          {coach.avatar_url ? (
            <img
              src={coach.avatar_url}
              alt={coach.full_name}
              className="w-24 h-24 rounded-full object-cover border-2"
              style={{ borderColor: "rgba(201,168,76,0.5)" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-black"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight">{coach.full_name}</h1>
            {coach.tagline && (
              <p className="text-zinc-400 mt-2 text-base leading-relaxed max-w-xs mx-auto">
                {coach.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-3 rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="text-center">
            <p className="text-3xl font-black" style={{ color: "#C9A84C" }}>{clientCount}</p>
            <p className="text-zinc-500 text-xs mt-1">clientes ativos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black" style={{ color: "#C9A84C" }}>{completionCount ?? 0}</p>
            <p className="text-zinc-500 text-xs mt-1">treinos concluídos</p>
          </div>
        </div>

        {/* What you get */}
        <div className="space-y-3">
          <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase text-center">O que está incluído</p>
          {[
            { icon: "📋", title: "Plano de treino personalizado", desc: "Adaptado ao teu nível, objetivos e equipamento" },
            { icon: "📊", title: "Acompanhamento semanal", desc: "Check-ins, feedback e ajustes ao longo do tempo" },
            { icon: "💬", title: "Chat direto com o coach", desc: "Tira dúvidas e mantém-te motivado" },
            { icon: "📸", title: "Registo de progresso", desc: "Fotos, medidas e recordes pessoais" },
            { icon: "🏆", title: "Desafios e objetivos", desc: "Metas semanais para te manteres focado" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Transformations */}
        {transformations && transformations.length > 0 && (
          <div className="space-y-5">
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase text-center">Resultados Reais</p>
            <div className="grid grid-cols-1 gap-5">
              {transformations.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <p className="absolute top-2 left-2 text-xs font-bold bg-black/60 px-2 py-0.5 rounded-full text-zinc-300">Antes</p>
                      <div className="aspect-[3/4] bg-zinc-900">
                        <img
                          src={t.before_url}
                          alt={`${t.display_name} antes`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <p
                        className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full text-black"
                        style={{ background: "#C9A84C" }}
                      >
                        Depois
                      </p>
                      <div className="aspect-[3/4] bg-zinc-900">
                        <img
                          src={t.after_url}
                          alt={`${t.display_name} depois`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-white font-semibold text-sm">{t.display_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {t.highlight && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-black"
                          style={{ background: "#C9A84C" }}
                        >
                          {t.highlight}
                        </span>
                      )}
                      {t.duration_weeks && (
                        <span className="text-xs text-zinc-500">{t.duration_weeks} semanas</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <div className="space-y-5">
            <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase text-center">
              O que dizem os clientes
            </p>
            <div className="grid grid-cols-1 gap-4">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div
                    className="text-brand-gold text-4xl font-black leading-none mb-3"
                    style={{ opacity: 0.3, color: "#C9A84C" }}
                  >
                    &ldquo;
                  </div>
                  <p className="text-white text-sm leading-relaxed">{t.content}</p>
                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-semibold">{t.display_name}</p>
                      {t.result_highlight && (
                        <p className="text-xs" style={{ color: "#C9A84C" }}>{t.result_highlight}</p>
                      )}
                    </div>
                    {t.duration_weeks && (
                      <p className="text-zinc-600 text-xs">{t.duration_weeks} sem.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={`/auth/signup?coach=${coachId}`}
            className="block w-full text-center py-4 rounded-2xl font-black text-black text-base tracking-wide transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Quero começar 🚀
          </Link>
          <p className="text-zinc-600 text-xs text-center">
            Já tens conta? <Link href="/auth/login" className="text-zinc-400 hover:text-white transition-colors underline">Entra aqui</Link>
          </p>
        </div>

        <p className="text-zinc-700 text-xs text-center">
          Powered by <span className="font-black tracking-tighter">KRAV<span style={{ color: "#C9A84C" }}>.</span></span>
        </p>
      </div>
    </div>
  );
}
