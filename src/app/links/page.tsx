"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface CardData {
  id: string;
  badge: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  disabled?: boolean;
  featured?: boolean;
  photo?: string;
  bgGradient: string;
  modal?: { title: string; desc: string; cta: string; href: string };
}

const CARDS: CardData[] = [
  {
    id: "pdf",
    badge: "GRÁTIS",
    title: "Guia de Treino",
    sub: "Recebe no teu email — sem spam",
    cta: "Quero o guia",
    href: "/guia",
    featured: true,
    photo: "/andre-bg.jpg",
    bgGradient: "linear-gradient(160deg,#0d1a00,#1a2e00,#0d0d0d)",
  },
  {
    id: "coaching",
    badge: "COACHING ONLINE",
    title: "Transforma o teu corpo",
    sub: "Plano personalizado + acompanhamento real",
    cta: "Saber mais",
    href: "https://www.kravcoaching.com",
    photo: "/andre-bg.jpg",
    bgGradient: "linear-gradient(160deg,#1a1200,#2e1f00,#0d0d0d)",
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
    sub: "Código: MPKRAV no checkout",
    cta: "Ver produtos",
    href: "https://www.myprotein.com",
    bgGradient: "linear-gradient(160deg,#0d0d0d,#111)",
  },
  {
    id: "community",
    badge: "EM BREVE",
    title: "Comunidade KRAV",
    sub: "Grupo privado exclusivo",
    cta: "Entrar na lista",
    href: "#",
    disabled: true,
    bgGradient: "linear-gradient(160deg,#0d0d0d,#0d0d0d)",
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
        style={{ background: "#0c0c0c", border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44" style={{ background: card.bgGradient }}>
          {card.photo && <Image src={card.photo} alt={card.title} fill className="object-cover" style={{ objectPosition: "center 20%" }} />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.5) 50%, #0c0c0c 100%)" }} />
          <div className="absolute top-5 left-5">
            <span className="text-[9px] font-black tracking-[0.22em] uppercase px-3 py-1.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}>
              {card.badge}
            </span>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors" style={{ background: "rgba(0,0,0,0.5)" }}>
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
  const inner = (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#0f0f0f",
        border: card.featured ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.06)",
        opacity: card.disabled ? 0.4 : 1,
        boxShadow: card.featured ? "0 0 40px rgba(201,168,76,0.06)" : "none",
      }}
    >
      {/* Image strip */}
      <div className="relative" style={{ height: card.featured ? 180 : 156 }}>
        <div className="absolute inset-0" style={{ background: card.bgGradient }} />
        {card.photo && (
          <Image
            src={card.photo}
            alt={card.title}
            fill
            className="object-cover"
            style={{
              objectPosition: card.id === "coaching" ? "center 15%" : "center 20%",
              // tint to differentiate cards
              filter: card.id === "coaching" ? "brightness(0.75) saturate(0.9)" : "brightness(0.85)",
            }}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{
          background: card.photo
            ? "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 45%, #0f0f0f 100%)"
            : "radial-gradient(ellipse at 25% 60%, rgba(201,168,76,0.06) 0%, transparent 60%)",
        }} />
        {/* Badge */}
        <div className="absolute top-4 left-4">
          <span
            className="text-[9px] font-black tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
            style={
              card.disabled
                ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#52525b" }
                : { background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.32)", color: "#C9A84C" }
            }
          >
            {card.badge}
          </span>
        </div>
        {/* Title */}
        <div className="absolute bottom-4 left-4 right-14">
          <p className={`text-[1.15rem] font-black leading-tight tracking-tight ${card.disabled ? "text-zinc-600" : "text-white"}`}>
            {card.title}
          </p>
          <p className={`text-xs mt-0.5 ${card.disabled ? "text-zinc-700" : "text-zinc-400"}`}>{card.sub}</p>
        </div>
        {/* Floating CTA on image */}
        <div className="absolute bottom-4 right-4">
          <div
            className="flex items-center gap-1 text-[11px] font-black px-3 py-2 rounded-xl whitespace-nowrap"
            style={
              card.disabled
                ? { background: "rgba(255,255,255,0.05)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }
                : { background: "linear-gradient(135deg,#C9A84C,#A8893A)", color: "#000", boxShadow: "0 2px 12px rgba(201,168,76,0.25)" }
            }
          >
            {card.disabled ? <LockIcon /> : null}
            {card.disabled ? card.cta : <><ChevronRight /></>}
          </div>
        </div>
      </div>
    </div>
  );

  if (card.disabled) return <div className="cursor-not-allowed select-none">{inner}</div>;
  if (card.modal && onOpen) return <button className="w-full text-left active:scale-[0.99] transition-transform duration-150" onClick={onOpen}>{inner}</button>;

  const isInternal = card.href.startsWith("/");
  return (
    <a href={card.href} {...(!isInternal && { target: "_blank", rel: "noopener noreferrer" })}
      className="block active:scale-[0.99] transition-transform duration-150">
      {inner}
    </a>
  );
}

/* ─── Social Row ──────────────────────────────────────────────────────────────── */
function SocialRow() {
  const socials = [
    {
      id: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@kravdoesntlift",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z"/>
        </svg>
      ),
    },
    {
      id: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/@kravdoesntlift",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {socials.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2.5 py-5 rounded-2xl active:scale-[0.98] transition-transform duration-150"
          style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}
        >
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
    <main className="min-h-screen flex flex-col" style={{ background: "#080808" }}>

      {/* ── Profile hero with photo banner ── */}
      <div className="relative w-full" style={{ height: 220 }}>
        {/* Background photo */}
        {!imgError ? (
          <Image
            src="/andre-bg.jpg"
            alt="André Kravchuk"
            fill
            className="object-cover"
            style={{ objectPosition: "center 18%" }}
            onError={() => setImgError(true)}
            priority
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#1a1200,#2e1f00,#0d0d0d)" }} />
        )}
        {/* Gradient: transparent top → full black bottom */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.2) 40%, rgba(8,8,8,0.85) 80%, #080808 100%)"
        }} />
        {/* Vignette sides */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)"
        }} />
      </div>

      {/* ── Profile info (overlaps banner) ── */}
      <div className="relative -mt-16 flex flex-col items-center px-5 pb-0 z-10">
        {/* Avatar ring */}
        <div
          className="w-[76px] h-[76px] rounded-full overflow-hidden flex items-center justify-center font-black text-lg shrink-0 mb-3"
          style={{
            background: "linear-gradient(135deg,#E8C96B,#A8893A)",
            color: "#000",
            boxShadow: "0 0 0 3px #080808, 0 0 0 5px rgba(201,168,76,0.35)",
          }}
        >
          <Image
            src="/andre-bg.jpg"
            alt="André Kravchuk"
            width={76}
            height={76}
            className="object-cover w-full h-full"
            style={{ objectPosition: "center 5%" }}
            onError={() => {}}
          />
        </div>

        <div className="text-center space-y-1 mb-3">
          <h1 className="text-lg font-black text-white tracking-tight">André Kravchuk</h1>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.65)" }}>@kravdoesntlift</p>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed text-center max-w-[230px] mb-4">
          Personal Trainer certificado.<br />Transformações reais, sem atalhos.
        </p>

        <div className="flex gap-2 mb-7">
          {["Treino", "Nutrição", "Resultados"].map((tag) => (
            <span key={tag} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full max-w-sm mb-7" style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.15),transparent)" }} />

        {/* Cards */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {CARDS.map((card) => (
            <Card key={card.id} card={card} onOpen={card.modal ? () => setOpenCard(card) : undefined} />
          ))}
          <SocialRow />
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] mt-8 pb-6 tracking-widest uppercase" style={{ color: "rgba(201,168,76,0.12)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.25)" }}>KRAV</span>
        </p>

      </div>

      {openCard?.modal && <Modal card={openCard} onClose={() => setOpenCard(null)} />}
    </main>
  );
}
