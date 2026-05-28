"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface CardData {
  id: string;
  label: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  disabled?: boolean;
  gradient: string;
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
    label: "COACHING ONLINE",
    title: "Transforma o teu corpo",
    sub: "Plano personalizado + acompanhamento real",
    cta: "Saber mais",
    href: "https://www.kravcoaching.com",
    gradient: "linear-gradient(135deg, #1c1200 0%, #2a1d00 50%, #0d0d0d 100%)",
    modal: {
      title: "Coaching Online Personalizado",
      desc: "Treino e nutrição 100% feitos para ti. Plano semanal na app, check-ins de evolução, ajustes constantes e contacto direto comigo — sem planos genéricos.",
      cta: "Quero começar",
      href: "https://www.kravcoaching.com",
    },
  },
  {
    id: "transformations",
    label: "RESULTADOS",
    title: "Antes & Depois",
    sub: "Clientes reais, transformações reais",
    cta: "Ver resultados",
    href: "https://www.kravcoaching.com#resultados",
    gradient: "linear-gradient(135deg, #0d0d0d 0%, #111 100%)",
  },
  {
    id: "community",
    label: "EM BREVE",
    title: "Comunidade KRAV",
    sub: "Grupo privado exclusivo — entra na lista",
    cta: "Entrar na lista",
    href: "#",
    disabled: true,
    gradient: "linear-gradient(135deg, #0d0d0d 0%, #111 100%)",
  },
];

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

/* ─── Modal ─────────────────────────────────────────────────────────────────── */
function Modal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const m = card.modal!;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(201,168,76,0.15)",
          boxShadow: "0 0 60px rgba(201,168,76,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with gradient */}
        <div
          className="relative h-40"
          style={{ background: card.gradient }}
        >
          {/* Gold line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }}
          />
          {/* Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xs font-black tracking-[0.2em] uppercase px-4 py-2 rounded-full"
              style={{
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#C9A84C",
              }}
            >
              {card.label}
            </span>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-7 space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-white tracking-tight">{m.title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>
          </div>

          <a
            href={m.href}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base tracking-tight transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #E8C96B 0%, #C9A84C 50%, #A8893A 100%)",
              color: "#000",
              boxShadow: "0 4px 24px rgba(201,168,76,0.25)",
            }}
          >
            {m.cta}
            <ChevronRight />
          </a>

          <p className="text-center text-xs text-zinc-600">Sem contratos. Cancela quando quiseres.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ──────────────────────────────────────────────────────────────────── */
function Card({ card, onOpen }: { card: CardData; onOpen?: () => void }) {
  const content = (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Gradient strip */}
      <div className="h-[3px] w-full" style={{ background: card.disabled ? "rgba(255,255,255,0.05)" : "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }} />

      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5 min-w-0">
          <p
            className="text-[10px] font-black tracking-[0.18em] uppercase"
            style={{ color: card.disabled ? "#52525b" : "rgba(201,168,76,0.6)" }}
          >
            {card.label}
          </p>
          <p className={`font-bold text-base leading-tight ${card.disabled ? "text-zinc-600" : "text-white"}`}>
            {card.title}
          </p>
          <p className="text-xs text-zinc-600 truncate">{card.sub}</p>
        </div>

        <div
          className="shrink-0 flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl whitespace-nowrap"
          style={
            card.disabled
              ? { background: "rgba(255,255,255,0.04)", color: "#52525b", border: "1px solid rgba(255,255,255,0.06)" }
              : { background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }
          }
        >
          {card.cta}
          {!card.disabled && <ChevronRight />}
        </div>
      </div>
    </div>
  );

  if (card.disabled) return <div className="opacity-50 cursor-not-allowed select-none">{content}</div>;
  if (onOpen) return <button className="w-full text-left active:scale-[0.98] transition-transform" onClick={onOpen}>{content}</button>;
  return <a href={card.href} target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">{content}</a>;
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
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* ── Profile ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 text-center">

          {/* Avatar */}
          <div className="relative">
            <div
              className="w-[88px] h-[88px] rounded-full overflow-hidden flex items-center justify-center font-black text-2xl shrink-0"
              style={{
                background: "linear-gradient(135deg,#E8C96B,#A8893A)",
                color: "#000",
                boxShadow: "0 0 0 2px #080808, 0 0 0 4px rgba(201,168,76,0.35), 0 8px 32px rgba(201,168,76,0.12)",
              }}
            >
              {!imgError ? (
                <Image
                  src="/andre.jpg"
                  alt="André Kravchuk"
                  width={88}
                  height={88}
                  className="object-cover w-full h-full"
                  onError={() => setImgError(true)}
                />
              ) : "AK"}
            </div>
            <span
              className="absolute bottom-0.5 right-0.5 w-[14px] h-[14px] rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 0 2px #080808" }}
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-sm font-semibold" style={{ color: "#C9A84C" }}>@kravdoesntlift</p>
          </div>

          {/* Bio */}
          <p className="text-sm text-zinc-400 leading-relaxed max-w-[260px]">
            Personal Trainer certificado. Transformações reais, sem atalhos.
          </p>

          {/* Tags */}
          <div className="flex gap-2">
            {["Treino", "Nutrição", "Resultados"].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Gold divider ─────────────────────────────────────── */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

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
        <p className="text-center text-[11px] pb-2" style={{ color: "rgba(201,168,76,0.2)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.4)" }}>KRAV</span>
        </p>

      </div>

      {/* Modal */}
      {openCard?.modal && (
        <Modal card={openCard} onClose={() => setOpenCard(null)} />
      )}
    </main>
  );
}
