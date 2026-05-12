"use client";

import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Already installed? Do nothing.
    if (isInStandaloneMode()) return;

    // Already dismissed?
    if (localStorage.getItem("krav_install_dismissed") === "1") return;

    const p = detectPlatform();
    setPlatform(p);
    setDismissed(false);

    // Android: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("krav_install_dismissed", "1");
    setDismissed(true);
  }

  async function installAndroid() {
    if (!deferredPrompt) {
      setShowIOSSteps(true); // fallback
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }

  if (dismissed || platform === null || platform === "desktop") return null;

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
            <p className="text-zinc-500 text-xs mt-0.5">Acede mais rápido, sem browser</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 -m-1 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Android: native install or fallback steps */}
      {platform === "android" && !showIOSSteps && (
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
            <div className="space-y-2">
              <p className="text-zinc-400 text-xs font-medium">No Chrome:</p>
              <ol className="space-y-1.5">
                {[
                  { icon: "⋮", label: 'Toca nos "3 pontos" (canto superior direito)' },
                  { icon: "＋", label: '"Adicionar ao ecrã inicial"' },
                  { icon: "✓",  label: 'Confirma "Instalar"' },
                ].map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-black"
                      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                    >
                      {i + 1}
                    </span>
                    {s.label}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* iOS steps */}
      {platform === "ios" && (
        <div className="space-y-2">
          <p className="text-zinc-400 text-xs font-medium">No Safari:</p>
          <ol className="space-y-1.5">
            {[
              'Toca em  (botão "Partilhar" na barra inferior)',
              '"Adicionar ao ecrã de início"',
              'Toca em "Adicionar" (canto superior direito)',
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
          <p className="text-zinc-600 text-[11px]">⚠️ Abre este site no Safari — noutros browsers não funciona</p>
        </div>
      )}
    </div>
  );
}
