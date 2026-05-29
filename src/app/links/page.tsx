"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface CardData {
  id: string;
  badge: string;
  title: string;
  sub: string;
  desc: string;
  cta: string;
  ctaColor: "gold" | "zinc" | "white";
  href: string;
  disabled?: boolean;
  featured?: boolean;
  bgGradient: string;
  modal?: {
    title: string;
    desc: string;
    cta: string;
    href: string;
  };
}

interface SocialCard {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

const CARDS: CardData[] = [
  {
    id: "pdf",
    badge: "GRÁTIS",
    title: "Guia de Treino",
    sub: "Download gratuito — sem email",
    desc: "O essencial para começares a treinar certo.",
    cta: "Download",
    ctaColor: "gold",
    href: "https://drive.google.com/file/d/1j0sW0sdZ3p4Mo859x6haPW-yb2TBB81g/view?usp=sharing",
    featured: true,
    bgGradient: "linear-gradient(160deg, #0d1a00 0%, #1a2e00 45%, #0d0d0d 100%)",
  },
  {
    id: "coaching",
    badge: "COACHING ONLINE",
    title: "Transforma o teu corpo",
    sub: "Plano personalizado + acompanhamento real",
    desc: "Treino e nutrição 100% feitos para ti.",
    cta: "Saber mais",
    ctaColor: "gold",
    href: "https://www.kravcoaching.com",
    bgGradient: "linear-gradient(160deg, #1a1200 0%, #2e1f00 45%, #0d0d0d 100%)",
    modal: {
      title: "Coaching Online Personalizado",
      desc: "Treino e nutrição 100% feitos para ti. Plano semanal na app, check-ins de evolução, ajustes constantes e contacto direto comigo — sem planos genéricos.",
      cta: "Quero começar",
      href: "https://www.kravcoaching.com",
    },
  },
  {
    id: "myprotein",
    badge: "PARCEIRO",
    title: "MyProtein",
    sub: "Usa o código no checkout",
    desc: "Suplementação de qualidade com desconto.",
    cta: "MPKRAV",
    ctaColor: "white",
    href: "https://www.myprotein.com",
    bgGradient: "linear-gradient(160deg, #000d1a 0%, #001a2e 45%, #0d0d0d 100%)",
  },
];

const SOCIALS: SocialCard[] = [
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@kravdoesntlift",
    color: "rgba(255,255,255,0.04)",
    textColor: "#fff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z"/>
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@kravdoesntlift",
    color: "rgba(255,255,255,0.04)",
    textColor: "#fff",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
      </svg>
    ),
  },
];

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
function ChevronRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  );
}

/* ─── Modal ─────────────────────────────────────────────────────────────────── */
function Modal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const m = card.modal!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: "#0c0c0c",
          border: "1px solid rgba(201,168,76,0.25)",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44" style={{ background: card.bgGradient }}>
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)"
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-20" style={{
            background: "linear-gradient(to top, #0c0c0c, transparent)"
          }} />
          <div className="absolute top-5 left-5">
            <span className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}>
              {card.badge}
            </span>
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.5)" }}>
            <CloseIcon />
          </button>
          <div className="absolute bottom-5 left-5 right-5">
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{card.title}</h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{card.sub}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>
          <a href={m.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 60%, #A8893A 100%)", color: "#000", boxShadow: "0 4px 28px rgba(201,168,76,0.2)" }}>
            {m.cta}
            <ChevronRight />
          </a>
          <p className="text-center text-xs text-zinc-700">Sem contratos. Cancela quando quiseres.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function Card({ card, onOpen }: { card: CardData; onOpen?: () => void }) {
  const isGold = card.ctaColor === "gold";
  const isWhite = card.ctaColor === "white";

  const inner = (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "#0f0f0f",
        border: card.featured
          ? "1px solid rgba(201,168,76,0.28)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: card.featured ? "0 0 30px rgba(201,168,76,0.05)" : "none",
      }}
    >
      {/* Image strip */}
      <div className="relative h-[136px]" style={{ background: card.bgGradient }}>
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 20% 60%, rgba(201,168,76,0.06) 0%, transparent 55%)"
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{
          background: "linear-gradient(to top, #0f0f0f, transparent)"
        }} />
        <div className="absolute top-4 left-4">
          <span className="text-[9px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
            {card.badge}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-lg font-black leading-tight tracking-tight text-white">{card.title}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{
        background: card.featured
          ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)"
          : "rgba(255,255,255,0.05)"
      }} />

      {/* Info + CTA */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight truncate text-zinc-300">{card.sub}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{card.desc}</p>
        </div>

        <div
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-black px-3.5 py-2 rounded-xl whitespace-nowrap"
          style={
            isGold
              ? { background: "linear-gradient(135deg, #C9A84C, #A8893A)", color: "#000", boxShadow: "0 2px 12px rgba(201,168,76,0.2)" }
              : isWhite
                ? { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", letterSpacing: "0.1em" }
                : { background: "rgba(255,255,255,0.04)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }
          }
        >
          {card.id === "pdf" ? <DownloadIcon /> : null}
          {card.cta}
          {card.id !== "pdf" && <ChevronRight />}
        </div>
      </div>
    </div>
  );

  if (card.modal && onOpen)
    return <button className="w-full text-left active:scale-[0.99] transition-transform duration-150" onClick={onOpen}>{inner}</button>;
  return (
    <a href={card.href} target="_blank" rel="noopener noreferrer"
      className="block active:scale-[0.99] transition-transform duration-150">
      {inner}
    </a>
  );
}

/* ─── Social Row ─────────────────────────────────────────────────────────────── */
function SocialRow() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.98] transition-transform duration-150"
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.06)",
            color: s.textColor,
          }}
        >
          {s.icon}
          <span className="text-[11px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
            {s.label}
          </span>
        </a>
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function LinksPage() {
  const [openCard, setOpenCard] = useState<CardData | null>(null);
  const [imgError, setImgError] = useState(false);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start py-14 px-5"
      style={{ background: "#080808" }}
    >
      <div className="w-full max-w-sm flex flex-col gap-7">

        {/* ── Profile ── */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div
              className="w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center font-black text-xl shrink-0"
              style={{
                background: "linear-gradient(135deg,#E8C96B,#A8893A)",
                color: "#000",
                boxShadow: "0 0 0 2px #080808, 0 0 0 3.5px rgba(201,168,76,0.4), 0 8px 24px rgba(201,168,76,0.1)",
              }}
            >
              {!imgError ? (
                <Image
                  src="/andre.jpg"
                  alt="André Kravchuk"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  onError={() => setImgError(true)}
                />
              ) : "AK"}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 0 2px #080808" }} />
          </div>

          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-xs font-semibold tracking-wide" style={{ color: "rgba(201,168,76,0.7)" }}>@kravdoesntlift</p>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
            Personal Trainer certificado. Transformações reais, sem atalhos.
          </p>

          <div className="flex gap-2">
            {["Treino", "Nutrição", "Resultados"].map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />

        {/* ── Cards ── */}
        <div className="flex flex-col gap-3">
          {CARDS.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpen={card.modal ? () => setOpenCard(card) : undefined}
            />
          ))}

          {/* Social row */}
          <SocialRow />
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] pb-2 tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.15)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.3)" }}>KRAV</span>
        </p>

      </div>

      {openCard?.modal && (
        <Modal card={openCard} onClose={() => setOpenCard(null)} />
      )}
    </main>
  );
}
