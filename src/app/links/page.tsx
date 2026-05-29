"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface CardData {
  id: string;
  badge: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  disabled?: boolean;
  visual: React.ReactNode;
  modal?: { title: string; desc: string; cta: string; href: string };
}

/* ─── Card visuals (CSS-only, no photos) ─────────────────────────────────────── */

function GuiaVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1a0a 0%, #081408 60%, #080808 100%)" }}>
      {/* Subtle grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      {/* Gold glow bottom-left */}
      <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)" }} />
      {/* Large faded icon */}
      <div className="absolute top-1/2 right-5 -translate-y-1/2 opacity-[0.06]">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
      </div>
    </div>
  );
}

function CoachingVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1000 0%, #120c00 60%, #080808 100%)" }}>
      {/* Diagonal lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 24px, rgba(201,168,76,0.03) 24px, rgba(201,168,76,0.03) 25px)",
      }} />
      {/* Gold glow */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)" }} />
      {/* Large K letter */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black leading-none select-none" style={{ fontSize: 110, color: "rgba(201,168,76,0.05)", fontFamily: "system-ui" }}>
        K
      </div>
    </div>
  );
}

function MyProteinVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #111 100%)" }}>
      {/* Dotted border suggestion (coupon style) */}
      <div className="absolute inset-3 rounded-xl" style={{ border: "1px dashed rgba(201,168,76,0.12)" }} />
      {/* The code as hero element */}
      <div className="text-center select-none">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(201,168,76,0.4)" }}>Código de desconto</p>
        <p className="font-black tracking-[0.18em]" style={{ fontSize: 32, color: "rgba(201,168,76,0.15)", letterSpacing: "0.2em" }}>MPKRAV</p>
      </div>
    </div>
  );
}

function CommunityVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#0a0a0a" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
    </div>
  );
}

/* ─── Cards data ─────────────────────────────────────────────────────────────── */
const CARDS: CardData[] = [
  {
    id: "pdf",
    badge: "GRÁTIS",
    title: "Guia de Treino",
    sub: "Recebe no teu email — sem spam",
    cta: "Quero o guia",
    href: "/guia",
    visual: <GuiaVisual />,
  },
  {
    id: "coaching",
    badge: "COACHING ONLINE",
    title: "Transforma o teu corpo",
    sub: "Plano personalizado + acompanhamento real",
    cta: "Saber mais",
    href: "https://www.kravcoaching.com",
    visual: <CoachingVisual />,
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
    sub: "Usa o código MPKRAV no checkout e tens desconto",
    cta: "Ver produtos",
    href: "https://www.myprotein.com",
    visual: <MyProteinVisual />,
  },
  {
    id: "community",
    badge: "EM BREVE",
    title: "Comunidade KRAV",
    sub: "Grupo privado exclusivo",
    cta: "Entrar na lista",
    href: "#",
    disabled: true,
    visual: <CommunityVisual />,
  },
];

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
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
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
function Modal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const m = card.modal!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl overflow-hidden"
        style={{ background: "#0c0c0c", border: "1px solid rgba(201,168,76,0.22)", boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top section */}
        <div className="relative h-36 overflow-hidden">
          {card.visual}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white transition-colors z-10"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <CloseIcon />
          </button>
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[9px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
              {card.badge}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: "linear-gradient(to top, #0c0c0c, transparent)" }} />
        </div>

        <div className="p-6 pt-4 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{card.title}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{card.sub}</p>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>
          <a href={m.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm tracking-wide active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C,#A8893A)", color: "#000", boxShadow: "0 4px 28px rgba(201,168,76,0.2)" }}>
            {m.cta} <ChevronRight />
          </a>
          <p className="text-center text-xs text-zinc-700">Sem contratos. Cancela quando quiseres.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function Card({ card, onOpen }: { card: CardData; onOpen?: () => void }) {
  const isFeatured = card.id === "pdf";

  const inner = (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0f0f0f",
        border: isFeatured
          ? "1px solid rgba(201,168,76,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        opacity: card.disabled ? 0.4 : 1,
        boxShadow: isFeatured ? "0 0 30px rgba(201,168,76,0.05)" : "none",
      }}
    >
      {/* Visual strip */}
      <div className="relative h-[140px]">
        {card.visual}
        {/* Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className="text-[9px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
            style={
              card.disabled
                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#52525b" }
                : { background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)", color: "#C9A84C" }
            }
          >
            {card.badge}
          </span>
        </div>
        {/* Fade to card bg */}
        <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: "linear-gradient(to top, #0f0f0f, transparent)" }} />
      </div>

      {/* Info row */}
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`font-black text-[15px] leading-tight tracking-tight ${card.disabled ? "text-zinc-600" : "text-white"}`}>
              {card.title}
            </p>
            <p className={`text-xs mt-1 leading-relaxed ${card.disabled ? "text-zinc-700" : "text-zinc-500"}`}>
              {card.sub}
            </p>
          </div>

          <div
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-black px-3.5 py-2.5 rounded-xl whitespace-nowrap mt-0.5"
            style={
              card.disabled
                ? { background: "rgba(255,255,255,0.04)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }
                : { background: "linear-gradient(135deg,#C9A84C,#A8893A)", color: "#000", boxShadow: "0 2px 12px rgba(201,168,76,0.2)" }
            }
          >
            {card.disabled ? <LockIcon /> : null}
            {card.disabled ? "Em breve" : <ChevronRight />}
          </div>
        </div>
      </div>
    </div>
  );

  if (card.disabled) return <div className="cursor-not-allowed select-none">{inner}</div>;
  if (card.modal && onOpen) return (
    <button className="w-full text-left active:scale-[0.99] transition-transform duration-150" onClick={onOpen}>{inner}</button>
  );
  const isInternal = card.href.startsWith("/");
  return (
    <a href={card.href} {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="block active:scale-[0.99] transition-transform duration-150">
      {inner}
    </a>
  );
}

/* ─── Social Row ─────────────────────────────────────────────────────────────── */
function SocialRow() {
  const socials = [
    {
      id: "tiktok", label: "TikTok",
      href: "https://www.tiktok.com/@kravdoesntlift",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z"/></svg>,
    },
    {
      id: "youtube", label: "YouTube",
      href: "https://www.youtube.com/@kravdoesntlift",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/></svg>,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {socials.map((s) => (
        <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl active:scale-[0.98] transition-transform duration-150"
          style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
          {s.icon}
          <span className="text-[11px] font-bold tracking-wide">{s.label}</span>
        </a>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function LinksPage() {
  const [openCard, setOpenCard] = useState<CardData | null>(null);
  const [imgError, setImgError] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ background: "#080808" }}>
      <div className="w-full max-w-sm px-5 flex flex-col items-center">

        {/* ── Profile ── */}
        <div className="flex flex-col items-center gap-3 pt-14 pb-6 text-center">

          {/* Avatar */}
          <div className="relative mb-1">
            <div
              className="w-[78px] h-[78px] rounded-full overflow-hidden flex items-center justify-center font-black text-xl shrink-0"
              style={{
                background: "linear-gradient(135deg,#E8C96B,#A8893A)",
                color: "#000",
                boxShadow: "0 0 0 2px #080808, 0 0 0 4px rgba(201,168,76,0.35)",
              }}
            >
              {!imgError ? (
                <Image
                  src="/andre-bg.jpg"
                  alt="André Kravchuk"
                  width={78}
                  height={78}
                  className="object-cover w-full h-full"
                  style={{ objectPosition: "center 5%" }}
                  onError={() => setImgError(true)}
                  priority
                />
              ) : "AK"}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 0 2px #080808" }} />
          </div>

          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
              @kravdoesntlift
            </p>
          </div>

          <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Personal Trainer certificado.<br />Transformações reais, sem atalhos.
          </p>

          {/* Tags — dourado */}
          <div className="flex gap-2">
            {["Treino", "Nutrição", "Resultados"].map((tag) => (
              <span key={tag} className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  color: "rgba(201,168,76,0.7)",
                }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px w-full mb-6" style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent)" }} />

        {/* ── Cards ── */}
        <div className="w-full flex flex-col gap-3 pb-8">
          {CARDS.map((card) => (
            <Card key={card.id} card={card} onOpen={card.modal ? () => setOpenCard(card) : undefined} />
          ))}
          <SocialRow />
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] pb-8 tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.12)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.25)" }}>KRAV</span>
        </p>

      </div>

      {openCard?.modal && <Modal card={openCard} onClose={() => setOpenCard(null)} />}
    </main>
  );
}
