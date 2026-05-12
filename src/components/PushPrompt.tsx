"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "krav_push_prompted";

export default function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show if: push supported, not yet prompted, permission still default
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
    } catch (err) {
      console.error("[PushPrompt] Error enabling push:", err);
    } finally {
      localStorage.setItem(STORAGE_KEY, "1");
      setLoading(false);
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[150] slide-up-enter"
      role="dialog"
      aria-label="Ativar notificações"
    >
      <div
        className="rounded-2xl p-4 shadow-2xl flex gap-4 items-start"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#111)",
          border: "1px solid rgba(201,168,76,0.25)",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
        >
          🔔
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Ativar notificações</p>
          <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
            Recebe alertas dos teus treinos e mensagens do coach.
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={dismiss}
              className="flex-1 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={enable}
              disabled={loading}
              className="flex-1 py-1.5 rounded-xl text-black text-xs font-bold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
            >
              {loading ? "..." : "Ativar"}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="text-zinc-600 hover:text-zinc-400 text-lg leading-none shrink-0 -mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}
