import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n/getLang";
import TestimonialForm from "./TestimonialForm";

const copy = {
  title:        { pt: "O teu testemunho", en: "Your testimonial" },
  no_request:   { pt: "Nenhum testemunho pedido ainda.", en: "No testimonial requested yet." },
  no_request_sub: {
    pt: "O teu coach irá pedir o teu testemunho quando o momento for certo.",
    en: "Your coach will request your testimonial when the time is right.",
  },
  already_done: { pt: "Testemunho enviado!", en: "Testimonial submitted!" },
  already_done_sub: {
    pt: "Obrigado por partilhares a tua experiência.",
    en: "Thank you for sharing your experience.",
  },
} as const;

export default async function ClientTestimonialPage() {
  const [supabase, lang] = await Promise.all([createClient(), getLang()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Find a pending testimonial request for this client
  const { data: testimonial } = await supabase
    .from("testimonials")
    .select(
      "id, display_name, result_highlight, duration_weeks, content, submitted_at"
    )
    .eq("client_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {copy.title[lang]}
        </h1>
      </div>

      {!testimonial && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 text-center space-y-2">
          <p className="text-4xl">💬</p>
          <p className="text-white font-semibold">{copy.no_request[lang]}</p>
          <p className="text-zinc-500 text-sm">{copy.no_request_sub[lang]}</p>
        </div>
      )}

      {testimonial && testimonial.submitted_at && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-10 text-center space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-white font-semibold">{copy.already_done[lang]}</p>
          <p className="text-zinc-500 text-sm">{copy.already_done_sub[lang]}</p>
          {testimonial.content && (
            <div className="mt-4 relative bg-zinc-800 rounded-xl p-4 text-left">
              <div
                className="text-brand-gold text-3xl font-black leading-none mb-2"
                style={{ opacity: 0.3 }}
              >
                &ldquo;
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed italic">
                {testimonial.content}
              </p>
            </div>
          )}
        </div>
      )}

      {testimonial && !testimonial.submitted_at && (
        <TestimonialForm testimonial={testimonial} lang={lang} />
      )}
    </div>
  );
}
