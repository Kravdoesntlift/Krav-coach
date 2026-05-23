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
  const [status, setStatus] = useState<string | null>(null);
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
    setStatus(null);
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
        // Subscribe at browser level first
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Save to server
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok !== false) {
          setSubscribed(true);
          setStatus("✅ Notificações ativadas!");
        } else {
          // Rollback browser subscription so state stays consistent
          await sub.unsubscribe();
          const msg = data.error ?? "Erro ao guardar subscrição";
          setStatus(`❌ ${msg}`);
          console.error("[push] Failed to save subscription:", data);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setStatus(`❌ ${msg}`);
      console.error("[push] Toggle failed:", err);
    }
    setLoading(false);
  }

  async function sendTest() {
    setTestLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/push/debug", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setStatus("✅ Notificação enviada! Deves recebê-la agora.");
      } else {
        setStatus(`❌ ${data.error ?? "Desconhecido"}`);
      }
    } catch {
      setStatus("❌ Erro de rede ao enviar teste.");
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

      {status && (
        <p className="text-xs px-1" style={{ color: status.startsWith("✅") ? "#C9A84C" : "#f87171" }}>
          {status}
        </p>
      )}
    </div>
  );
}
