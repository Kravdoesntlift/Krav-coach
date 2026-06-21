"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
interface CardData {
  id: string;
  badge: string;
  badgeColor?: "gold" | "green" | "white";
  title: string;
  sub: string;
  cta: string;
  ctaStyle: "gold" | "green" | "outline";
  href: string;
  disabled?: boolean;
  featured?: boolean;
  photo?: string;
  photoPosition?: string;
  bgStyle: React.CSSProperties;
  centerContent?: React.ReactNode;
  modal?: { title: string; desc: string; cta: string; href: string };
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

/* ─── Card visual backgrounds ────────────────────────────────────────────────── */
function GuiaBg() {
  return (
    <div className="absolute inset-0" style={{ background: "#0a0f0a" }}>
      {/* Grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(201,168,76,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.05) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }}/>
      {/* Gold glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{
        background: "radial-gradient(ellipse at 30% 100%, rgba(201,168,76,0.12) 0%, transparent 65%)"
      }}/>
      {/* Big faded checkmark */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.07]">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
    </div>
  );
}

function MyProteinBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#06080a" }}>
      {/* Radial gold glow — center */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.13) 0%, transparent 68%)"
      }}/>
      {/* Top-left corner accent */}
      <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full" style={{
        background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)"
      }}/>
      {/* Horizontal rule top */}
      <div className="absolute top-5 left-5 right-5 h-px" style={{
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)"
      }}/>
      {/* Horizontal rule bottom */}
      <div className="absolute bottom-5 left-5 right-5 h-px" style={{
        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)"
      }}/>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 select-none px-4">
        {/* Tag label */}
        <div className="flex items-center gap-1.5">
          <div className="h-px w-6" style={{ background: "rgba(201,168,76,0.35)" }}/>
          <p className="text-[9px] font-black tracking-[0.32em] uppercase" style={{ color: "rgba(201,168,76,0.55)" }}>
            código exclusivo
          </p>
          <div className="h-px w-6" style={{ background: "rgba(201,168,76,0.35)" }}/>
        </div>

        {/* THE CODE — hero element */}
        <p
          className="font-black tracking-[0.25em] leading-none"
          style={{
            fontSize: 38,
            color: "#fff",
            textShadow: "0 0 40px rgba(201,168,76,0.35), 0 0 80px rgba(201,168,76,0.15)",
          }}
        >
          MPKRAV
        </p>

        {/* Instruction */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <p className="text-[9px] font-bold tracking-wide" style={{ color: "rgba(201,168,76,0.7)" }}>
            aplica no checkout
          </p>
        </div>
      </div>
    </div>
  );
}

function CommunityBg() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#080808" }}>
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}/>
      <div className="relative opacity-[0.08] z-10">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── Cards data ─────────────────────────────────────────────────────────────── */
const CARDS: CardData[] = [
  {
    id: "pdf",
    badge: "✓ GRÁTIS",
    badgeColor: "green",
    title: "Guia de Treino",
    sub: "Download — enviado para o teu email",
    cta: "Quero o guia",
    ctaStyle: "gold",
    href: "/guia",
    featured: true,
    photo: "/pexels-hiral-chavda-1934832-8522509.jpg",
    photoPosition: "center 30%",
    bgStyle: { background: "#080a08" },
  },
  {
    id: "coaching",
    badge: "COACHING 1:1",
    badgeColor: "gold",
    title: "Transforma o teu corpo",
    sub: "App exclusiva · acompanhamento direto comigo",
    cta: "Trial grátis",
    ctaStyle: "gold",
    href: "/start",
    photo: "/pexels-tima-miroshnichenko-6389516.jpg",
    photoPosition: "center center",
    bgStyle: { background: "#1a1200" },
    modal: {
      title: "Coaching Online 1:1",
      desc: "Treino e nutrição 100% feitos para ti — plano semanal personalizado, check-ins de evolução, nutrição adaptada ao teu objetivo e acesso direto a mim via chat. Um cliente ganhou +20kg de massa. Sem planos genéricos. Sem desculpas.",
      cta: "Começar trial grátis de 7 dias",
      href: "/start",
    },
  },
  {
    id: "myprotein",
    badge: "PARCEIRO",
    badgeColor: "white",
    title: "MyProtein",
    sub: "Código MPKRAV · desconto no checkout",
    cta: "Ver produtos",
    ctaStyle: "outline",
    href: "https://www.myprotein.com",
    bgStyle: {},
  },
  {
    id: "community",
    badge: "EM BREVE",
    badgeColor: "white",
    title: "Comunidade KRAV",
    sub: "Grupo privado exclusivo",
    cta: "Entrar na lista",
    ctaStyle: "outline",
    href: "#",
    disabled: true,
    bgStyle: {},
  },
];

/* ─── CTA button ─────────────────────────────────────────────────────────────── */
function CtaButton({ style, disabled, children }: { style: "gold" | "green" | "outline"; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-full whitespace-nowrap"
      style={{ background: "rgba(255,255,255,0.05)", color: "#444", border: "1px solid rgba(255,255,255,0.07)" }}>
      <LockIcon /> Em breve
    </div>
  );

  const styles = {
    gold: { background: "linear-gradient(135deg,#E8C96B,#C9A84C,#A8893A)", color: "#000", boxShadow: "0 2px 16px rgba(201,168,76,0.3)" },
    green: { background: "#22c55e", color: "#000", boxShadow: "0 2px 12px rgba(34,197,94,0.3)" },
    outline: { background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)" },
  };

  return (
    <div className="flex items-center gap-1.5 text-[12px] font-black px-4 py-2.5 rounded-full whitespace-nowrap"
      style={styles[style]}>
      {children}
      <ArrowRight />
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────────────── */
function Badge({ text, color }: { text: string; color?: "gold" | "green" | "white" }) {
  const styles = {
    gold: { background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" },
    green: { background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.45)", color: "#4ade80" },
    white: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.65)" },
  };
  return (
    <span className="inline-block text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
      style={styles[color ?? "gold"]}>
      {text}
    </span>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
function Modal({ card, onClose }: { card: CardData; onClose: () => void }) {
  const m = card.modal!;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }}
      onClick={onClose}>
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl overflow-hidden"
        style={{ background: "#0f0c08", border: "1px solid rgba(201,168,76,0.22)", boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Image header */}
        <div className="relative h-44 overflow-hidden" style={card.bgStyle}>
          {card.photo && <Image src={card.photo} alt={card.title} fill className="object-cover" style={{ objectPosition: card.photoPosition ?? "center", filter: "brightness(0.55) saturate(0.8)" }} />}
          {!card.photo && card.id === "pdf" && <GuiaBg />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0f0c08 0%, transparent 55%)" }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white z-10"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <CloseIcon />
          </button>
          <div className="absolute bottom-4 left-4 z-10 space-y-1">
            <Badge text={card.badge} color={card.badgeColor} />
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{card.title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{m.desc}</p>
          <a href={m.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C,#A8893A)", color: "#000", boxShadow: "0 4px 28px rgba(201,168,76,0.2)" }}>
            {m.cta} <ArrowRight />
          </a>
          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>Sem contratos. Cancela quando quiseres.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ───────────────────────────────────────────────────────────────────── */
function Card({ card, onOpen }: { card: CardData; onOpen?: () => void }) {
  const inner = (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "#0f0c08",
        border: card.featured ? "1.5px solid rgba(201,168,76,0.35)" : "1px solid rgba(255,255,255,0.07)",
        opacity: card.disabled ? 0.45 : 1,
        boxShadow: card.featured ? "0 0 40px rgba(201,168,76,0.07), inset 0 1px 0 rgba(201,168,76,0.1)" : "none",
      }}>

      {/* ── Image area ── */}
      <div className="relative overflow-hidden" style={{ height: 168 }}>
        {/* Background */}
        <div className="absolute inset-0" style={card.bgStyle} />

        {/* Specific CSS backgrounds */}
        {card.id === "pdf" && !card.photo && <GuiaBg />}
        {card.id === "myprotein" && <MyProteinBg />}
        {card.id === "community" && <CommunityBg />}

        {/* Photo */}
        {card.photo && (
          <Image
            src={card.photo}
            alt={card.title}
            fill
            className="object-cover"
            style={{
              objectPosition: card.photoPosition ?? "center",
              filter: "brightness(0.5) saturate(0.75)",
            }}
          />
        )}

        {/* Gradient fade to bottom */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.3) 55%, #0f0c08 100%)"
        }} />

        {/* Badge + title overlaid — bottom left (like richard) */}
        {card.id !== "myprotein" && (
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5">
            <Badge text={card.badge} color={card.disabled ? "white" : card.badgeColor} />
            <p className={`text-xl font-black leading-tight tracking-tight ${card.disabled ? "text-zinc-600" : "text-white"}`}>
              {card.title}
            </p>
          </div>
        )}
      </div>

      {/* ── Info row ── */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[13px] font-bold leading-tight truncate ${card.disabled ? "text-zinc-600" : "text-white"}`}>
            {card.id === "myprotein" ? "MyProtein" : card.title}
          </p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: card.disabled ? "#3f3f46" : "rgba(255,255,255,0.35)" }}>
            {card.sub}
          </p>
        </div>
        <CtaButton style={card.ctaStyle} disabled={card.disabled}>
          {card.cta}
        </CtaButton>
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
      icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.79a4.85 4.85 0 01-1.01-.1z"/></svg>,
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
          className="flex flex-col items-center gap-2 py-5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "#0f0c08", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
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
    <main className="min-h-screen flex flex-col items-center" style={{ background: "#0a0806" }}>
      <div className="w-full max-w-sm px-4 flex flex-col items-center">

        {/* ── Profile ── */}
        <div className="flex flex-col items-center gap-3 pt-12 pb-7 text-center">

          {/* Avatar */}
          <div className="relative">
            <div className="w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center font-black text-xl"
              style={{
                background: "linear-gradient(135deg,#E8C96B,#A8893A)",
                color: "#000",
                boxShadow: "0 0 0 2.5px #0a0806, 0 0 0 4.5px rgba(201,168,76,0.4)",
              }}>
              {!imgError ? (
                <Image src="/andre-bg.jpg" alt="André Kravchuk" width={80} height={80}
                  className="object-cover w-full h-full"
                  style={{ objectPosition: "center 5%" }}
                  onError={() => setImgError(true)} priority />
              ) : "AK"}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 0 2px #0a0806" }} />
          </div>

          {/* Name + handle */}
          <div>
            <h1 className="text-[1.15rem] font-black text-white tracking-tight">André Kravchuk</h1>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(201,168,76,0.65)" }}>
              @kravdoesntlift
            </p>
          </div>

          {/* Bio */}
          <p className="text-xs leading-relaxed max-w-[240px] text-center" style={{ color: "rgba(255,255,255,0.38)" }}>
            De 59kg a estético — sem genética.<br />
            <span style={{ color: "rgba(201,168,76,0.7)" }}>Cliente ganhou +20kg de massa.</span>
          </p>

          {/* Trial pill */}
          <a href="/start"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)", color: "#000", boxShadow: "0 2px 20px rgba(201,168,76,0.25)" }}>
            <span>7 dias grátis</span>
            <span style={{ opacity: 0.6 }}>·</span>
            <span>sem cartão</span>
            <ArrowRight />
          </a>

          {/* Tags */}
          <div className="flex gap-2">
            {["Treino", "Nutrição", "Resultados"].map((t) => (
              <span key={t} className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.65)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px w-full mb-5" style={{ background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.18),transparent)" }} />

        {/* ── Cards ── */}
        <div className="w-full flex flex-col gap-3 pb-6">
          {CARDS.map((card) => (
            <Card key={card.id} card={card}
              onOpen={card.modal ? () => setOpenCard(card) : undefined} />
          ))}
          <SocialRow />
        </div>

        {/* Footer */}
        <p className="text-[10px] pb-8 tracking-widest uppercase text-center"
          style={{ color: "rgba(201,168,76,0.12)" }}>
          powered by <span className="font-black" style={{ color: "rgba(201,168,76,0.28)" }}>KRAV</span>
        </p>
      </div>

      {openCard?.modal && <Modal card={openCard} onClose={() => setOpenCard(null)} />}
    </main>
  );
}
