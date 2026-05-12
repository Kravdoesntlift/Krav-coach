"use client";

import { useEffect, useState } from "react";

type Platform = "ios" | "android" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISS_KEY = "krav_install_v2_until";
const DISMISS_DAYS = 7;

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (isStandalone()) return; // already installed

    const p = detectPlatform();
    if (!p) return; // desktop — skip

    // Check if dismissed and still within window
    const until = localStorage.getItem(DISMISS_KEY);
    if (until && Date.now() < Number(until)) return;

    setPlatform(p);
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setVisible(false);
  }

  async function installAndroid() {
    if (deferredPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (deferredPrompt as any).prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === "accepted") { dismiss(); return; }
      setDeferredPrompt(null);
    }
  }

  if (!visible || !platform) return null;

  return (
    <div
      className="rounded-2xl p-4 space-y-3 border border-brand-gold/20"
      style={{ background: "rgba(201,168,76,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base font-black text-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            📲
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">Instala a app</p>
            <p className="text-zinc-500 text-xs mt-0.5">Acede mais rápido, sem abrir o browser</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 -m-1 shrink-0" aria-label="Fechar">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Android */}
      {platform === "android" && (
        <div className="space-y-2">
          {deferredPrompt ? (
            <button
              onClick={installAndroid}
              className="w-full py-2.5 rounded-xl text-black text-sm font-bold transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              Instalar agora
            </button>
          ) : (
            <ol className="space-y-1.5">
              {[
                'Toca nos "⋮" (canto superior direito do Chrome)',
                '"Adicionar ao ecrã inicial"',
                'Confirma "Instalar"',
              ].map((label, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    {i + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* iOS */}
      {platform === "ios" && (
        <div className="space-y-2">
          <ol className="space-y-1.5">
            {[
              "Abre este site no Safari (não noutro browser)",
              'Toca no ícone  (barra inferior do Safari)',
              '"Adicionar ao ecrã de início"',
              'Toca "Adicionar" — fica no teu ecrã como uma app!',
            ].map((label, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-400">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black mt-0.5"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
