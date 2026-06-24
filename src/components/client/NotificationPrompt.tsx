"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/useLang";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const DISMISS_KEY = "krav_notif_prompt_until";
const DISMISS_DAYS = 7;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { lang } = useLang();
  const isEN = lang === "en";

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    const until = localStorage.getItem(DISMISS_KEY);
    if (until && Date.now() < Number(until)) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setVisible(false);
  }

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { dismiss(); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setDone(true);
      setTimeout(() => setVisible(false), 2000);
    } catch (err) {
      console.error("Push subscribe failed:", err);
      dismiss();
    }
    setLoading(false);
  }

  if (!visible) return null;

  const benefits = isEN
    ? [
        "💬 Coach messages in real time",
        "🏋️ Reminders so you don't miss workouts",
        "📊 Alert when your report is ready",
      ]
    : [
        "💬 Mensagens do coach em tempo real",
        "🏋️ Lembretes para não perderes treinos",
        "📊 Aviso quando o teu relatório estiver pronto",
      ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        style={{ animation: "fadeIn 0.25s ease" }}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-1 max-w-lg mx-auto"
        style={{ animation: "slideUp 0.35s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(201,168,76,0.12) 0%, #0a0a0c 60%)",
            border: "1px solid rgba(201,168,76,0.25)",
          }}
        >
          {done ? (
            /* ── Success state ── */
            <div className="p-7 text-center space-y-2">
              <div className="text-4xl">🔔</div>
              <p className="text-white font-bold text-lg">
                {isEN ? "Notifications enabled!" : "Notificações ativas!"}
              </p>
              <p className="text-zinc-400 text-sm">
                {isEN
                  ? "You'll receive your coach's messages in real time."
                  : "Vais receber as mensagens do teu coach em tempo real."}
              </p>
            </div>
          ) : (
            /* ── Prompt state ── */
            <div className="p-6 space-y-5">
              {/* Handle */}
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto" />

              {/* Icon + text */}
              <div className="flex gap-4 items-start">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  🔔
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold text-base leading-tight">
                    {isEN ? "Enable notifications" : "Ativa as notificações"}
                  </p>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {isEN
                      ? "Get coach messages, workout reminders and important alerts — directly on your phone."
                      : "Recebe mensagens do teu coach, lembretes de treino e avisos importantes — diretamente no teu telemóvel."}
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-xs text-zinc-400">
                    <span className="text-base leading-none">{b.split(" ")[0]}</span>
                    <span>{b.split(" ").slice(1).join(" ")}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={enable}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-black text-base transition-all active:scale-95 hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {loading
                    ? (isEN ? "Enabling..." : "A ativar...")
                    : (isEN ? "Enable notifications" : "Ativar notificações")}
                </button>
                <button
                  onClick={dismiss}
                  className="w-full py-3 rounded-2xl text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
                >
                  {isEN ? "Maybe later" : "Talvez mais tarde"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}
