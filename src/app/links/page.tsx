"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Card data ─────────────────────────────────────────────────────────────── */
const CARDS = [
  {
    id: "coaching",
    badge: "COACHING ONLINE",
    badgeColor: "#C9A84C",
    title: "Coaching Personalizado",
    sub: "Treino e nutrição adaptados a ti",
    cta: "Quero saber mais →",
    ctaColor: "#C9A84C",
    ctaText: "#000",
    href: "https://www.kravcoaching.com",
    modal: {
      badge: "COACHING ONLINE",
      badgeColor: "#C9A84C",
      title: "Coaching Personalizado",
      desc: "Plano de treino 100% feito para ti, acompanhamento semanal, app exclusiva no teu telemóvel e suporte direto comigo. Sem planos genéricos — só resultados reais.",
      cta: "Começar agora →",
      href: "https://www.kravcoaching.com",
    },
    bg: "linear-gradient(160deg, #1a1200 0%, #0d0d0d 60%)",
    icon: "🏋️",
  },
  {
    id: "app",
    badge: "APP EXCLUSIVA",
    badgeColor: "#6366f1",
    title: "Já és cliente?",
    sub: "Acede à tua área pessoal",
    cta: "Entrar na app →",
    ctaColor: "#6366f1",
    ctaText: "#fff",
    href: "https://www.kravcoaching.com/auth/login",
    modal: null,
    bg: "linear-gradient(160deg, #0d0d1a 0%, #0d0d0d 60%)",
    icon: "📱",
  },
  {
    id: "instagram",
    badge: "INSTAGRAM",
    badgeColor: "#e1306c",
    title: "@kravdoesntlift",
    sub: "Treino, nutrição e lifestyle diário",
    cta: "Seguir →",
    ctaColor: "#e1306c",
    ctaText: "#fff",
    href: "https://instagram.com/kravdoesntlift",
    modal: null,
    bg: "linear-gradient(160deg, #1a000d 0%, #0d0d0d 60%)",
    icon: "📸",
  },
  {
    id: "community",
    badge: "EM BREVE",
    badgeColor: "#52525b",
    title: "Comunidade KRAV",
    sub: "Grupo privado — a chegar em breve",
    cta: "Entrar na lista →",
    ctaColor: "#52525b",
    ctaText: "#fff",
    href: "#",
    modal: null,
    bg: "linear-gradient(160deg, #111 0%, #0d0d0d 60%)",
    icon: "🔒",
  },
];

/* ─── Modal ─────────────────────────────────────────────────────────────────── */
function Modal({ card, onClose }: { card: typeof CARDS[0]; onClose: () => void }) {
  const m = card.modal!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden animate-fade-in"
        style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image area */}
        <div
          className="relative h-44 flex items-center justify-center"
          style={{ background: card.bg }}
        >
          <span className="text-6xl">{card.icon}</span>
          <span
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-widest px-4 py-1.5 rounded-full"
            style={{ background: m.badgeColor, color: "#000" }}
          >
            ✓ {m.badge}
          </span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-sm"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <h2 className="text-2xl font-black text-white">{m.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>
          <a
            href={m.href}
            className="block w-full py-4 rounded-2xl text-center font-black text-base transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)", color: "#000" }}
          >
            {m.cta}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function Card({ card, onClick }: { card: typeof CARDS[0]; onClick?: () => void }) {
  const isDisabled = card.href === "#";
  const Inner = (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.98] cursor-pointer"
      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "#111" }}
    >
      {/* Top image strip */}
      <div
        className="relative h-28 flex items-center justify-center"
        style={{ background: card.bg }}
      >
        <span className="text-5xl">{card.icon}</span>
        <span
          className="absolute top-3 left-3 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase"
          style={{
            background: `${card.badgeColor}22`,
            border: `1px solid ${card.badgeColor}55`,
            color: card.badgeColor,
          }}
        >
          {card.badge}
        </span>
      </div>

      {/* Bottom content */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{card.title}</p>
          <p className="text-zinc-500 text-xs truncate">{card.sub}</p>
        </div>
        <span
          className="shrink-0 text-xs font-black px-4 py-2 rounded-xl whitespace-nowrap"
          style={{ background: isDisabled ? "#27272a" : card.ctaColor, color: isDisabled ? "#52525b" : card.ctaText }}
        >
          {card.cta}
        </span>
      </div>
    </div>
  );

  if (onClick) return <div onClick={onClick}>{Inner}</div>;
  if (isDisabled) return <div className="opacity-60 cursor-not-allowed">{Inner}</div>;
  return <a href={card.href} target="_blank" rel="noopener noreferrer">{Inner}</a>;
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function LinksPage() {
  const [openCard, setOpenCard] = useState<typeof CARDS[0] | null>(null);
  const [imgError, setImgError] = useState(false);

  return (
    <main
      className="min-h-screen flex flex-col items-center py-12 px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="w-full max-w-sm space-y-6">

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-black text-2xl"
              style={{
                background: "linear-gradient(135deg,#E8C96B,#A8893A)",
                color: "#000",
                boxShadow: "0 0 0 3px #C9A84C44, 0 0 0 6px #C9A84C11",
              }}
            >
              {!imgError ? (
                <Image
                  src="/andre.jpg"
                  alt="André Kravchuk"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                "AK"
              )}
            </div>
            {/* Online dot */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
              style={{ background: "#22c55e", borderColor: "#0a0a0a" }}
            />
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-sm font-medium" style={{ color: "#C9A84C" }}>@kravdoesntlift</p>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Personal Trainer certificado. Treino e nutrição adaptados a ti — resultados reais, sem atalhos.
          </p>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap justify-center">
            {["Treino", "Nutrição", "Lifestyle"].map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  color: "rgba(201,168,76,0.8)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

        {/* Cards */}
        <div className="space-y-3">
          {CARDS.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={card.modal ? () => setOpenCard(card) : undefined}
            />
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-700 pb-4">
          powered by{" "}
          <Link href="https://www.kravcoaching.com" className="font-bold" style={{ color: "#C9A84C88" }}>
            KRAV
          </Link>
        </p>
      </div>

      {/* Modal */}
      {openCard?.modal && (
        <Modal card={openCard} onClose={() => setOpenCard(null)} />
      )}
    </main>
  );
}
