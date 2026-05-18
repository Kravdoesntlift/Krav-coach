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
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

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
    setTestStatus(null);
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
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        if (res.ok) {
          setSubscribed(true);
        } else {
          const data = await res.json().catch(() => ({}));
          console.error("Failed to save subscription:", data);
        }
      }
    } catch (err) {
      console.error("Push toggle failed:", err);
    }
    setLoading(false);
  }

  async function sendTest() {
    setTestLoading(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/push/debug", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("✅ Notificação enviada! Deves recebê-la agora.");
      } else {
        setTestStatus(`❌ Erro: ${data.error ?? "Desconhecido"}`);
      }
    } catch {
      setTestStatus("❌ Erro de rede ao enviar teste.");
    }
    setTestLoading(false);
  }

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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

        {subscribed && (
          <button
            onClick={sendTest}
            disabled={testLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            {testLoading ? "..." : "Testar"}
          </button>
        )}
      </div>

      {testStatus && (
        <p className="text-xs px-1" style={{ color: testStatus.startsWith("✅") ? "#C9A84C" : "#f87171" }}>
          {testStatus}
        </p>
      )}
    </div>
  );
}
