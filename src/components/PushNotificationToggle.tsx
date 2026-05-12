"use client";

import { useState, useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true);
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function toggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", { method: "DELETE" });
        }
        setSubscribed(false);
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Push toggle failed:", err);
    }
    setLoading(false);
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors ${
        subscribed
          ? "bg-brand-gold/10 border border-brand-gold/30 text-brand-gold"
          : "bg-zinc-800 border border-zinc-700 text-gray-400 hover:text-white"
      }`}
    >
      <span>{subscribed ? "🔔" : "🔕"}</span>
      <span className="hidden sm:block">
        {loading ? "..." : subscribed ? "Notificações ativas" : "Ativar notificações"}
      </span>
    </button>
  );
}
