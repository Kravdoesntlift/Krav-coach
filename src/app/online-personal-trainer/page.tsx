import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import ScrollReveal from "@/components/ScrollReveal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

export const metadata: Metadata = {
  title: "Online Personal Trainer | KRAV Coach — Free 7-Day Trial",
  description:
    "Online personal trainer with a 100% personalised plan, weekly check-ins and direct chat with your coach. Real results — no gym required. Free 7-day trial, no credit card.",
  keywords: [
    "online personal trainer",
    "online fitness coach",
    "personal trainer online",
    "online coaching fitness",
    "personalised workout plan online",
    "fitness coaching app",
    "online gym coach",
    "muscle gain online coach",
    "weight loss personal trainer online",
    "remote personal trainer",
    "best online personal trainer",
  ],
  openGraph: {
    title: "Online Personal Trainer | KRAV Coach",
    description:
      "Personalised plan, nutrition and direct coaching — all in the app. Free 7-day trial.",
    url: "https://kravcoaching.com/online-personal-trainer",
    siteName: "KRAV Coach",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://kravcoaching.com/online-personal-trainer",
  },
};

const faqItems = [
  {
    q: "What is an online personal trainer?",
    a: "An online personal trainer creates and adjusts your workout and nutrition plan remotely — via app. You get weekly check-ins, direct chat and continuous feedback, without needing to schedule in-person sessions.",
  },
  {
    q: "Is the plan really personalised or is it a generic template?",
    a: "100% personalised. Before you sign up you answer a questionnaire about your goals, level, equipment and available days. Your coach builds the plan based on your answers — never a template.",
  },
  {
    q: "Do I need a gym?",
    a: "No. The plan adapts to your equipment — full gym, basic gym, home training with weights, or bodyweight only. Tell us what you have and your coach creates the plan accordingly.",
  },
  {
    q: "When do I receive my plan?",
    a: "Within 24 working hours of signing up. Your coach receives your answers immediately and has that window to create and deliver your personalised plan in the app.",
  },
  {
    q: "How much does an online personal trainer cost?",
    a: "KRAV Coach is €127/month with everything included — workout plan, nutrition, AI Coach 24/7, weekly check-ins and direct chat with your coach. You can try it free for 7 days, no credit card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No commitment, no contracts. Cancel at any time through your client area. No questions asked.",
  },
  {
    q: "Does it work for beginners?",
    a: "Yes. The plan is fully adapted to your level — whether you're a complete beginner, intermediate or advanced. If you've never trained before, your coach starts from scratch with you.",
  },
  {
    q: "How does the weekly check-in work?",
    a: "Every week you complete a check-in in the app (weight, energy levels, notes). Your coach reviews it and adjusts the plan if needed. Direct chat is always available for any questions.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Online Personal Trainer — KRAV Coach",
  description:
    "Personalised fitness coaching with a weekly training plan, nutrition tracking and real accountability from your coach.",
  provider: {
    "@type": "Organization",
    name: "KRAV Coach",
    url: "https://kravcoaching.com",
  },
  areaServed: { "@type": "Place", name: "Worldwide" },
  offers: {
    "@type": "Offer",
    price: "127",
    priceCurrency: "EUR",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "127",
      priceCurrency: "EUR",
      unitText: "month",
    },
    availability: "https://schema.org/InStock",
  },
};

const features = [
  { icon: "📋", title: "100% personalised plan",    desc: "Created by your coach based on your level, goals and available equipment. Never a generic template." },
  { icon: "📱", title: "App on your phone",         desc: "Install as an app, train offline, receive notifications. Works on iOS and Android." },
  { icon: "🤖", title: "AI Coach 24/7",             desc: "AI assistant personalised to your plan. Ask anything about training, nutrition and recovery at any time." },
  { icon: "🥗", title: "Nutrition & macros",        desc: "Database of thousands of foods. Automatically calculates calories, protein, carbs and micronutrients." },
  { icon: "💬", title: "Direct chat with your coach", desc: "Ask questions, share results and stay motivated in real time." },
  { icon: "📊", title: "Weekly check-ins",          desc: "Check-ins, feedback and continuous plan adjustments as you progress." },
  { icon: "🏆", title: "Progress tracking",         desc: "Weight, measurements, personal records and achievements. Compare before/after photos with an interactive slider." },
  { icon: "⚡", title: "Live workout mode",         desc: "Rest timer with audio cue, set and weight tracking — all during your workout." },
];

const steps = [
  { n: "1", title: "Sign up",           desc: "Fill in the questionnaire in 2 minutes. Your coach receives your answers immediately." },
  { n: "2", title: "Get your plan",     desc: "Within 24 working hours your coach creates and sends your personalised plan in the app." },
  { n: "3", title: "Train with support", desc: "Follow the plan, log your workouts and track your progress — your coach is always available." },
];

const included = [
  "100% personalised weekly training plan",
  "Weekly plan adjustments",
  "Check-ins and progress analysis",
  "Private chat with your coach",
  "AI Coach available 24/7",
  "Nutrition & macro tracking",
  "Sets, weights and measurements log",
  "Progress photos with before/after slider",
  "Personal records and achievements",
  "Monthly progress report (PDF)",
  "Automated notifications and reminders",
  "Access to the iOS and Android app (PWA)",
];

export default async function OnlinePersonalTrainerPage() {
  const admin = createAdminClient();
  const { data: coach } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, tagline_en, bio_en, years_experience, credentials, transformation_before_url, transformation_after_url")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  const initials = coach?.full_name
    ? coach.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "K";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Ambient glow */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">

          {/* ── NAV ──────────────────────────────────────────────── */}
          <nav className="flex items-center justify-between px-5 py-5 max-w-2xl mx-auto">
            <Link href="/" className="text-xl font-black tracking-tighter">
              KRAV<span style={{ color: "#C9A84C" }}>.</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/personal-trainer-online"
                className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                PT
              </Link>
              <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Log in →
              </Link>
            </div>
          </nav>

          {/* ── HERO ─────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pt-10 pb-20 text-center">
            <ScrollReveal direction="up" delay={0}>
              <div className="space-y-7">
                {/* Badge */}
                {coach && (
                  <div>
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full"
                      style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      {coach.avatar_url ? (
                        <Image src={coach.avatar_url} alt={coach.full_name} width={28} height={28} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
                          {initials}
                        </div>
                      )}
                      <span className="text-sm font-semibold" style={{ color: "#C9A84C" }}>{coach.full_name}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "#C9A84C" }}>
                    Online Personal Trainer · Worldwide
                  </p>
                  <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.03em] leading-[1.05]">
                    Your training.<br />
                    <span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Personalised.
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-lg leading-relaxed max-w-sm mx-auto">
                    {coach?.tagline_en || "Premium fitness coaching with real accountability — on your phone, 24/7."}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Link
                    href="/start"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110 w-full sm:w-auto"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    Start free 7-day trial →
                  </Link>
                  <p className="text-zinc-500 text-xs">Then €127/month · No contracts</p>
                </div>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-zinc-500 text-sm border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
                >
                  I already have an account
                </Link>
              </div>
            </ScrollReveal>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)" }} />
          </div>

          {/* ── COACH BIO ────────────────────────────────────────── */}
          {coach && (coach.bio_en || (coach.credentials && coach.credentials.length > 0)) && (
            <section className="max-w-2xl mx-auto px-5 pb-16">
              <ScrollReveal direction="up">
                <div
                  className="rounded-3xl p-6 space-y-5"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {coach.avatar_url ? (
                      <Image
                        src={coach.avatar_url}
                        alt={coach.full_name}
                        width={64} height={64}
                        className="rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-black shrink-0"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base">{coach.full_name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">Personal Trainer & Coach</p>
                      {coach.years_experience && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-black"
                          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>
                          ★ {coach.years_experience}+ years experience
                        </div>
                      )}
                    </div>
                  </div>

                  {coach.bio_en && (
                    <p className="text-zinc-400 text-sm leading-relaxed">{coach.bio_en}</p>
                  )}

                  {coach.credentials && coach.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(coach.credentials as string[]).map((cr: string) => (
                        <span
                          key={cr}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300"
                          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
                        >
                          <span style={{ color: "#C9A84C" }}>✓</span>
                          {cr}
                        </span>
                      ))}
                    </div>
                  )}

                  {coach.transformation_before_url && coach.transformation_after_url && (
                    <div className="space-y-3 pt-2">
                      <p className="text-zinc-500 text-xs font-bold tracking-[0.15em] uppercase text-center">
                        My own transformation
                      </p>
                      <BeforeAfterSlider
                        beforeUrl={coach.transformation_before_url}
                        afterUrl={coach.transformation_after_url}
                        beforeLabel="Before"
                        afterLabel="After"
                        aspectRatio="4/5"
                      />
                      <p className="text-zinc-600 text-xs text-center">Drag the slider to compare</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </section>
          )}

          {/* ── FEATURES ─────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                Everything that&apos;s included
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <ScrollReveal key={f.title} direction="up" delay={Math.floor(i / 2) * 100}>
                  <div
                    className="rounded-2xl p-5 space-y-2 h-full"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="text-2xl">{f.icon}</div>
                    <p className="text-white font-bold text-sm">{f.title}</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── HOW IT WORKS ─────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                How it works
              </p>
            </ScrollReveal>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <ScrollReveal key={s.n} direction="up" delay={i * 90}>
                  <div
                    className="flex items-start gap-4 p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-black shrink-0"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{s.title}</p>
                      <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── INSTALL PWA ──────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-6">
            <ScrollReveal direction="up">
              <div className="space-y-2 text-center">
                <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase">
                  Install the app on your phone
                </p>
                <p className="text-zinc-500 text-sm">Works like a native app — no need to visit the App Store.</p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* iOS */}
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>🍎</div>
                    <div>
                      <p className="text-white font-bold text-sm">iPhone / iPad</p>
                      <p className="text-zinc-500 text-xs">Safari</p>
                    </div>
                  </div>
                  <ol className="space-y-2.5">
                    {[
                      "Open kravcoaching.com in Safari",
                      "Tap the ⎋ share icon (bottom bar)",
                      '"Add to Home Screen"',
                      'Tap "Add" — done! 🎉',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-zinc-400">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>{i + 1}</span>
                        {text}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Android */}
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-black text-black"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>🤖</div>
                    <div>
                      <p className="text-white font-bold text-sm">Android</p>
                      <p className="text-zinc-500 text-xs">Chrome</p>
                    </div>
                  </div>
                  <ol className="space-y-2.5">
                    {[
                      "Open kravcoaching.com in Chrome",
                      'Tap "⋮" (top right corner)',
                      '"Add to Home Screen"',
                      'Tap "Install" — done! 🎉',
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs text-zinc-400">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>{i + 1}</span>
                        {text}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="none" delay={160}>
              <p className="text-center text-zinc-600 text-xs">
                💡 Once installed, the app works offline and receives workout notifications.
              </p>
            </ScrollReveal>
          </section>

          {/* ── PRICE ────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20">
            <ScrollReveal direction="up">
              <div
                className="rounded-3xl p-7 space-y-6"
                style={{
                  background: "linear-gradient(160deg, rgba(201,168,76,0.10) 0%, rgba(10,10,12,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <div className="text-center space-y-1">
                  <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Premium Plan</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-white">€127</span>
                    <span className="text-zinc-500 text-base">/month</span>
                  </div>
                  <p className="text-zinc-500 text-sm">Everything included. No surprises.</p>
                </div>

                <ul className="space-y-2.5">
                  {included.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-black"
                        style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/start"
                  className="block text-center w-full py-4 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  Join now →
                </Link>

                {/* Guarantee badge */}
                <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-lg">🛡️</span>
                  <div className="text-left">
                    <p className="text-white text-xs font-bold">7-day guarantee</p>
                    <p className="text-zinc-500 text-xs">Try it risk-free. Full refund if you&apos;re not satisfied.</p>
                  </div>
                </div>

                <p className="text-center text-zinc-600 text-xs">Cancel at any time. No commitment.</p>
              </div>
            </ScrollReveal>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── RESULT ───────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-16 space-y-6">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                Real result
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <div
                className="rounded-3xl p-6 space-y-5"
                style={{
                  background: "linear-gradient(160deg, rgba(201,168,76,0.07) 0%, rgba(10,10,12,0.95) 100%)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-black" style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      +20kg
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">muscle mass</p>
                  </div>
                  <div className="h-14 w-px shrink-0" style={{ background: "rgba(201,168,76,0.2)" }} />
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Client started from scratch and built 20 kg of muscle mass with personalised weekly plans, nutrition tracking and direct coaching.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "💬 24/7 support",
                    "🔒 Cancel anytime",
                    "🎯 Plan in 24h",
                    "📱 App included",
                  ].map((badge, i) => (
                    <span
                      key={i}
                      className="text-zinc-500 text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── FAQ ──────────────────────────────────────────────── */}
          <section className="max-w-2xl mx-auto px-5 pb-20 space-y-4">
            <ScrollReveal direction="up">
              <p className="text-zinc-500 text-xs font-bold tracking-[0.18em] uppercase text-center">
                Frequently asked questions about online personal training
              </p>
            </ScrollReveal>

            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 60}>
                  <details className="group rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-white text-sm font-semibold pr-4">{item.q}</span>
                      <span className="text-zinc-500 text-lg shrink-0 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-5 pb-4">
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ── DIVIDER ──────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-5 pb-6">
            <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <footer className="max-w-2xl mx-auto px-5 pb-10 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-black tracking-tighter text-base text-zinc-600">
              KRAV<span style={{ color: "#A8893A" }}>.</span>
            </span>
            <div className="flex gap-4">
              <Link href="/auth/login" className="hover:text-zinc-400 transition-colors">Log in</Link>
              <Link href="/start" className="hover:text-zinc-400 transition-colors">Sign up</Link>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
