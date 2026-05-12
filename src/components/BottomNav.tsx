"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface Props {
  items: NavItem[];
  moreItems?: NavItem[];
  userId?: string;
}

export default function BottomNav({ items, moreItems, userId }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [extraUnread, setExtraUnread] = useState(0);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Find the chat/messages item to know which href to badge
  const msgItem = items.find(i =>
    i.href.includes("chat") || i.href.includes("messages")
  );

  // Reset extra unread when user visits the chat/messages page
  useEffect(() => {
    if (msgItem && pathname.startsWith(msgItem.href)) {
      setExtraUnread(0);
    }
  }, [pathname, msgItem]);

  // Realtime subscription — increment badge on new incoming message
  useEffect(() => {
    if (!userId || !msgItem) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`unread-nav:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          // Only bump if not currently on the chat page
          setExtraUnread((n) => n + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, msgItem]);

  const isMoreActive = moreItems?.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  function getBadge(item: NavItem) {
    const base = item.badge ?? 0;
    if (msgItem && item.href === msgItem.href) {
      // Don't show extra if already on that page
      const onPage = pathname.startsWith(msgItem.href);
      return base + (onPage ? 0 : extraUnread);
    }
    return base;
  }

  return (
    <>
      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: "rgba(7,7,9,0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-stretch h-[60px]">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge  = getBadge(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 relative group"
              >
                {/* Active indicator line */}
                <span
                  className={`absolute top-0 inset-x-[30%] h-[2px] rounded-b-full transition-all duration-300 ${
                    active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                  }`}
                  style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }}
                />

                {/* Icon */}
                <span className={`relative transition-all duration-200 ${active ? "scale-110" : "scale-100 group-active:scale-95"}`}>
                  <span className={`block transition-colors duration-200 ${active ? "text-brand-gold" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                  {badge > 0 && (
                    <span
                      className="absolute -top-1 -right-2 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                      style={{ background: "linear-gradient(135deg, #E8C96B, #C9A84C)" }}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>

                <span className={`text-[9px] font-semibold tracking-widest uppercase transition-colors duration-200 ${
                  active ? "text-brand-gold" : "text-zinc-600 group-hover:text-zinc-400"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More */}
          {moreItems && moreItems.length > 0 && (
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 relative group"
            >
              <span
                className={`absolute top-0 inset-x-[30%] h-[2px] rounded-b-full transition-all duration-300 ${
                  drawerOpen || isMoreActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                }`}
                style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }}
              />
              <span className={`transition-all duration-200 ${drawerOpen ? "rotate-45" : ""} ${drawerOpen || isMoreActive ? "text-brand-gold scale-110" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                <GridIcon />
              </span>
              <span className={`text-[9px] font-semibold tracking-widest uppercase transition-colors duration-200 ${
                drawerOpen || isMoreActive ? "text-brand-gold" : "text-zinc-600 group-hover:text-zinc-400"
              }`}>
                Mais
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Drawer */}
      {moreItems && moreItems.length > 0 && (
        <>
          {drawerOpen && (
            <div
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setDrawerOpen(false)}
            />
          )}

          <div
            className={`fixed bottom-[60px] left-0 right-0 z-40 md:hidden rounded-t-3xl transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              background: "rgba(14,14,18,0.97)",
              backdropFilter: "blur(24px)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-9 h-1 rounded-full bg-zinc-700" />
            </div>

            <div className="px-5 pb-8 grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl transition-all active:scale-95 ${
                      active
                        ? "bg-brand-gold/12 border border-brand-gold/25"
                        : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className={`text-2xl leading-none transition-colors ${active ? "text-brand-gold" : "text-zinc-300"}`}>
                      {item.icon}
                    </span>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${active ? "text-brand-gold" : "text-zinc-400"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
