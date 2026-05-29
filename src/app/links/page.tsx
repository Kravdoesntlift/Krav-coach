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
  ctaColor: "gold" | "zinc";
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

const CARDS: CardData[] = [
  {
    id: "coaching",
    badge: "COACHING ONLINE",
    title: "Transforma o teu corpo",
    sub: "Plano personalizado + acompanhamento real",
    desc: "Treino e nutrição 100% feitos para ti. Sem planos genéricos.",
    cta: "Saber mais",
    ctaColor: "gold",
    href: "https://www.kravcoaching.com",
    featured: true,
    bgGradient: "linear-gradient(160deg, #1a1200 0%, #2e1f00 40%, #0d0d0d 100%)",
    modal: {
      title: "Coaching Online Personalizado",
      desc: "Treino e nutrição 100% feitos para ti. Plano semanal na app, check-ins de evolução, ajustes constantes e contacto direto comigo — sem planos genéricos.",
      cta: "Quero começar",
      href: "https://www.kravcoaching.com",
    },
  },
  {
    id: "transformations",
    badge: "RESULTADOS",
    title: "Antes & Depois",
    sub: "Clientes reais, transformações reais",
    desc: "Vê os resultados de quem já passou pelo processo.",
    cta: "Ver resultados",
    ctaColor: "gold",
    href: "https://www.kravcoaching.com#resultados",
    bgGradient: "linear-gradient(160deg, #0d0d0d 0%, #111 100%)",
  },
  {
    id: "community",
    badge: "EM BREVE",
    title: "Comunidade KRAV",
    sub: "Grupo privado exclusivo",
    desc: "Entra na lista de espera e sê o primeiro a saber.",
    cta: "Entrar na lista",
    ctaColor: "zinc",
    href: "#",
    disabled: true,
    bgGradient: "linear-gradient(160deg, #0d0d0d 0%, #0d0d0d 100%)",
  },
];

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
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
          border: card.featured ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image area */}
        <div className="relative h-44" style={{ background: card.bgGradient }}>
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }} />
          {/* Gold shimmer lines */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)"
          }} />
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20" style={{
            background: "linear-gradient(to top, #0c0c0c, transparent)"
          }} />
          {/* Badge */}
          <div className="absolute top-5 left-5">
            <span
              className="text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.35)",
                color: "#C9A84C",
              }}
            >
              {card.badge}
            </span>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <CloseIcon />
          </button>
          {/* Title in image */}
          <div className="absolute bottom-5 left-5 right-5">
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{card.title}</h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{card.sub}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>

          <a
            href={m.href}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 60%, #A8893A 100%)",
              color: "#000",
              boxShadow: "0 4px 28px rgba(201,168,76,0.2)",
            }}
          >
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

  const inner = (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "#0f0f0f",
        border: card.featured
          ? "1px solid rgba(201,168,76,0.28)"
          : "1px solid rgba(255,255,255,0.06)",
        opacity: card.disabled ? 0.45 : 1,
        boxShadow: card.featured ? "0 0 30px rgba(201,168,76,0.05)" : "none",
      }}
    >
      {/* ── Image strip ── */}
      <div
        className="relative h-[148px]"
        style={{ background: card.bgGradient }}
      >
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        {/* Gold glow */}
        {!card.disabled && (
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 20% 60%, rgba(201,168,76,0.07) 0%, transparent 55%)"
          }} />
        )}
        {/* Bottom fade into card */}
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{
          background: "linear-gradient(to top, #0f0f0f, transparent)"
        }} />

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[9px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
            style={
              card.disabled
                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#52525b" }
                : { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }
            }
          >
            {card.badge}
          </span>
        </div>

        {/* Title overlaid on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className={`text-lg font-black leading-tight tracking-tight ${card.disabled ? "text-zinc-600" : "text-white"}`}>
            {card.title}
          </p>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        className="h-px mx-4"
        style={{
          background: card.featured
            ? "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)"
            : "rgba(255,255,255,0.05)"
        }}
      />

      {/* ── Info + CTA row ── */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-tight truncate ${card.disabled ? "text-zinc-600" : "text-zinc-300"}`}>
            {card.sub}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{card.desc}</p>
        </div>

        <div
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-black px-3.5 py-2 rounded-xl whitespace-nowrap transition-all"
          style={
            card.disabled
              ? { background: "rgba(255,255,255,0.04)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }
              : isGold
                ? { background: "linear-gradient(135deg, #C9A84C, #A8893A)", color: "#000", boxShadow: "0 2px 12px rgba(201,168,76,0.2)" }
                : { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          {card.disabled && <LockIcon />}
          {card.cta}
          {!card.disabled && <ChevronRight />}
        </div>
      </div>
    </div>
  );

  if (card.disabled) return <div className="cursor-not-allowed select-none">{inner}</div>;
  if (onOpen) return <button className="w-full text-left active:scale-[0.99] transition-transform duration-150" onClick={onOpen}>{inner}</button>;
  return <a href={card.href} target="_blank" rel="noopener noreferrer" className="block active:scale-[0.99] transition-transform duration-150">{inner}</a>;
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

        {/* ── Profile ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 text-center">

          {/* Avatar */}
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
            <span
              className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 0 2px #080808" }}
            />
          </div>

          {/* Name */}
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-xs font-semibold tracking-wide" style={{ color: "rgba(201,168,76,0.7)" }}>@kravdoesntlift</p>
          </div>

          {/* Bio */}
          <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
            Personal Trainer certificado. Transformações reais, sem atalhos.
          </p>

          {/* Tags */}
          <div className="flex gap-2">
            {["Treino", "Nutrição", "Resultados"].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Gold divider ─────────────────────────────────────── */}
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />

        {/* ── Cards ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {CARDS.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpen={card.modal ? () => setOpenCard(card) : undefined}
            />
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <p className="text-center text-[10px] pb-2 tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.15)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.3)" }}>KRAV</span>
        </p>

      </div>

      {/* Modal */}
      {openCard?.modal && (
        <Modal card={openCard} onClose={() => setOpenCard(null)} />
      )}
    </main>
  );
}
