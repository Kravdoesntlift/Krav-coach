"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logout } from "@/app/auth/actions";
import type { Profile } from "@/lib/supabase/types";

export interface NavItem {
  href?: string;
  label: string;
  badge?: number;
  children?: { href: string; label: string }[];
}

interface NavbarProps {
  profile: Profile;
  navItems: NavItem[];
}

export default function Navbar({ profile, navItems }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header
      className="hidden md:block fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(7,7,9,0.88)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href={navItems.find((i) => i.href)?.href ?? "/"}
          className="shrink-0 flex items-center gap-0"
        >
          <span className="text-[17px] font-black tracking-tighter text-white select-none">
            KRAV<span className="text-brand-gold">.</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {navItems.map((item, i) =>
            item.children ? (
              <DropdownItem key={i} item={item} pathname={pathname} />
            ) : (
              <NavLink key={item.href} item={item} pathname={pathname} />
            )
          )}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2.5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-700"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
                style={{ background: "linear-gradient(135deg, #E8C96B, #A8893A)" }}
              >
                {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
            <span className="text-sm text-zinc-400 truncate max-w-[100px]">
              {profile?.full_name?.split(" ")[0] ?? ""}
            </span>
          </div>
          <div className="w-px h-4 bg-zinc-800 hidden lg:block" />
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors font-medium"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
  return (
    <Link
      href={item.href!}
      className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? "text-white bg-white/[0.07]"
          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
      }`}
    >
      {active && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px"
          style={{ background: "#C9A84C", boxShadow: "0 0 6px #C9A84C" }}
        />
      )}
      {item.label}
      {item.badge != null && item.badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
          style={{ background: "linear-gradient(135deg, #E8C96B, #C9A84C)" }}
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}

function DropdownItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isChildActive = item.children?.some((c) => pathname === c.href);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isChildActive
            ? "text-white bg-white/[0.07]"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
        }`}
      >
        {item.label}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-44 rounded-2xl overflow-hidden shadow-2xl slide-up-enter"
          style={{
            background: "rgba(14,14,18,0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {item.children!.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "text-brand-gold bg-brand-gold/8"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {active && <span className="w-1 h-1 rounded-full bg-brand-gold shrink-0" />}
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
