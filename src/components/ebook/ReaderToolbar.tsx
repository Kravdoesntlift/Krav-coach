"use client";

import Link from "next/link";

/**
 * The bar the buyer sees at the top of the book: which version they are
 * reading, and how to keep it.
 *
 * Someone who trains at home and opens a book full of barbell work assumes it
 * was not written for them and asks for a refund, so the choice is the first
 * thing on the page rather than a query parameter nobody knows about.
 */
export default function ReaderToolbar({
  token,
  lang,
  variant,
}: {
  token: string;
  lang: "pt" | "en";
  variant: "gym" | "home";
}) {
  const isEN = lang === "en";
  const href = (v: "gym" | "home", l: "pt" | "en") =>
    `/ebook/ler?t=${encodeURIComponent(token)}${v === "home" ? "&v=home" : ""}${l === "en" ? "&lang=en" : ""}`;

  const pill = (active: boolean) =>
    `px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${
      active ? "text-black" : "text-zinc-500 hover:text-zinc-300"
    }`;
  const activeStyle = { background: "linear-gradient(135deg,#E8C96B,#C9A84C)" };

  return (
    <div
      className="sticky top-0 z-20 print:hidden backdrop-blur"
      style={{ background: "rgba(8,8,10,0.86)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="mx-auto flex max-w-[720px] flex-wrap items-center gap-3 px-6 py-3 sm:px-10">
        <span className="text-base font-black tracking-tighter text-white">
          KRAV<span style={{ color: "#C9A84C" }}>.</span>
        </span>

        <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <Link href={href("gym", lang)} className={pill(variant === "gym")} style={variant === "gym" ? activeStyle : undefined}>
            {isEN ? "Gym" : "Ginásio"}
          </Link>
          <Link href={href("home", lang)} className={pill(variant === "home")} style={variant === "home" ? activeStyle : undefined}>
            {isEN ? "Home" : "Casa"}
          </Link>
        </div>

        <div className="flex overflow-hidden rounded-full" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
          <Link href={href(variant, "pt")} className={pill(!isEN)} style={!isEN ? activeStyle : undefined}>PT</Link>
          <Link href={href(variant, "en")} className={pill(isEN)} style={isEN ? activeStyle : undefined}>EN</Link>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded-full px-4 py-1.5 text-[11px] font-bold text-zinc-300 transition-colors hover:text-white"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {isEN ? "Save as PDF" : "Guardar em PDF"}
        </button>
      </div>
    </div>
  );
}
