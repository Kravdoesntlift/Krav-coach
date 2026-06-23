import type { Metadata } from "next";
import Link from "next/link";

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

const benefits = [
  {
    icon: "📋",
    title: "100% personalised plan",
    desc: "Built by your coach around your goals, level and available equipment. Never a copy-paste template.",
  },
  {
    icon: "💬",
    title: "Direct chat with your coach",
    desc: "Ask questions, share results and get real feedback in real time — not weeks later.",
  },
  {
    icon: "🤖",
    title: "AI Coach 24/7",
    desc: "AI assistant trained on your plan. Answers anything about training, nutrition and recovery at any hour.",
  },
  {
    icon: "📊",
    title: "Weekly check-ins",
    desc: "Regular progress tracking, coach feedback and continuous plan adjustments. The plan evolves with you.",
  },
  {
    icon: "🥗",
    title: "Nutrition & macros",
    desc: "Food database with thousands of items. Calories, protein, carbs — all calculated automatically.",
  },
  {
    icon: "📱",
    title: "App on your phone",
    desc: "Install as a native app on iOS and Android. Train offline, receive push notifications.",
  },
];

const steps = [
  {
    n: "1",
    title: "Sign up in 2 minutes",
    desc: "Answer the questionnaire about your goals, level and equipment. Your coach receives everything instantly.",
  },
  {
    n: "2",
    title: "Get your plan within 24h",
    desc: "Your coach builds your personalised plan and sends it in the app. Training, nutrition and strategy — all explained.",
  },
  {
    n: "3",
    title: "Train with real support",
    desc: "Follow the plan, log your workouts, do weekly check-ins. Your coach is always available.",
  },
];

export default function OnlinePersonalTrainerPage() {
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

      <main className="bg-black text-white min-h-screen font-sans">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
          <Link href="/" className="font-black text-lg tracking-tight" style={{ color: "#C9A84C" }}>
            KRAV
          </Link>
          <Link
            href="/start"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Start free →
          </Link>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-12 pb-16 max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
            Online Personal Trainer · Worldwide
          </p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
            Your training.<br />
            <span style={{ background: "linear-gradient(90deg,#E8C96B,#C9A84C,#A8893A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Personalised.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Training and nutrition plan built by your coach — with weekly accountability and direct chat.
            No gym required. No generic templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/start"
              className="inline-block px-8 py-4 rounded-2xl font-bold text-black text-base"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Start free 7-day trial →
            </Link>
            <Link
              href="/"
              className="inline-block px-8 py-4 rounded-2xl font-semibold text-white text-base"
              style={{ border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
            >
              See how it works
            </Link>
          </div>
          <p className="text-zinc-600 text-sm mt-4">7 days free · no credit card · cancel anytime</p>
        </section>

        {/* Result proof */}
        <section className="px-6 pb-16 max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <p className="text-5xl font-black mb-2" style={{ color: "#C9A84C" }}>+20 kg</p>
            <p className="text-white font-semibold text-lg mb-1">of muscle mass</p>
            <p className="text-zinc-400 text-sm">Real client · 18 months of online coaching · no steroids</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Everything that's included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-2xl mb-3">{b.icon}</p>
                <p className="font-bold text-white mb-1">{b.title}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">How it works</h2>
          <div className="flex flex-col gap-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5 items-start">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shrink-0"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {s.n}
                </div>
                <div>
                  <p className="font-bold text-white mb-1">{s.title}</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Price */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-zinc-400 text-sm mb-2 uppercase tracking-widest font-semibold">Premium Plan</p>
            <p className="text-5xl font-black text-white mb-1">€127<span className="text-2xl text-zinc-400 font-normal">/month</span></p>
            <p className="text-zinc-500 text-sm mb-8">Everything included. No surprises.</p>
            <Link
              href="/start"
              className="inline-block w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-black text-base mb-3"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Start free 7-day trial →
            </Link>
            <p className="text-zinc-600 text-sm">Cancel at any time. No commitment.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 pb-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">
            Frequently asked questions about online personal training
          </h2>
          <div className="flex flex-col gap-4">
            {faqItems.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="font-bold text-white mb-2">{q}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-24 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to start?</h2>
          <p className="text-zinc-400 mb-8">7 days free. No credit card. Cancel whenever you want.</p>
          <Link
            href="/start"
            className="inline-block px-10 py-4 rounded-2xl font-bold text-black text-base"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            Start free trial →
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-6 py-8 text-center text-zinc-600 text-xs">
          <Link href="/" className="font-black text-sm mr-6" style={{ color: "#C9A84C" }}>KRAV Coach</Link>
          <Link href="/start" className="mr-4 hover:text-white transition-colors">Sign up</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Log in</Link>
          <p className="mt-4">© {new Date().getFullYear()} KRAV Coach · Online Personal Trainer</p>
        </footer>
      </main>
    </>
  );
}
