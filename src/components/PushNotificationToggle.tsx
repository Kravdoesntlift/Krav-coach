"use client";

import { useState, useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

async function saveSubscription(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  return res.json().catch(() => ({})) as Promise<{ ok?: boolean; error?: string }>;
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    if (Notification.permission === "denied") {
      setPermDenied(true);
      return;
    }

    // Use ready (not register) — ServiceWorkerRegister in layout handles registration
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        setSubscribed(true);
        return;
      }

      // Subscription missing but permission is granted — likely lost after a SW update.
      // Re-subscribe silently so the user doesn't have to do anything.
      if (Notification.permission === "granted") {
        try {
          const newSub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          await saveSubscription(newSub);
          setSubscribed(true);
        } catch {
          // Silent fail — user can manually re-enable from the toggle
          setSubscribed(false);
        }
      }
    });
  }, []);

  async function toggle() {
    setLoading(true);
    setStatus(null);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        await fetch("/api/push/subscribe", { method: "DELETE" });
        setSubscribed(false);
        return;
      }

      // Request permission explicitly — required on iOS after SW update resets it
      if (Notification.permission !== "granted") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          const denied = result === "denied";
          setPermDenied(denied);
          setStatus(
            denied
              ? "❌ Bloqueado — vai a Definições > Notificações > KRAV Coach e ativa."
              : "❌ Permissão não concedida."
          );
          return;
        }
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const data = await saveSubscription(sub);

      if (data.ok !== false) {
        setSubscribed(true);
        setPermDenied(false);
        setStatus("✅ Notificações ativadas!");
      } else {
        await sub.unsubscribe();
        setStatus(`❌ ${data.error ?? "Erro ao guardar subscrição"}`);
        console.error("[push] Failed to save subscription:", data);
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const isPermError = raw.toLowerCase().includes("notallowed") || raw.toLowerCase().includes("permission");
      const msg = isPermError
        ? isIOS()
          ? "❌ Bloqueado — vai a Definições > Notificações > KRAV Coach e ativa."
          : "❌ Permissão negada — verifica as definições de notificação do browser."
        : `❌ ${raw}`;
      setStatus(msg);
      console.error("[push] Toggle failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setTestLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/push/debug", { method: "POST" });
      const data = await res.json();
      setStatus(data.ok ? "✅ Notificação enviada! Deves recebê-la agora." : `❌ ${data.error ?? "Desconhecido"}`);
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
            permDenied
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : subscribed
              ? "bg-brand-gold/10 border border-brand-gold/30 text-brand-gold"
              : "bg-zinc-800 border border-zinc-700 text-gray-400 hover:text-white"
          }`}
        >
          <span>{subscribed ? "🔔" : "🔕"}</span>
          <span className="hidden sm:block">
            {loading
              ? "..."
              : permDenied
              ? "Notificações bloqueadas"
              : subscribed
              ? "Notificações ativas"
              : "Ativar notificações"}
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
        <p className="text-xs px-1 leading-snug" style={{ color: status.startsWith("✅") ? "#C9A84C" : "#f87171" }}>
          {status}
        </p>
      )}

      {permDenied && !status && (
        <p className="text-xs px-1 text-red-400 leading-snug">
          Notificações bloqueadas — vai a <strong>Definições &gt; Notificações &gt; KRAV Coach</strong> para ativar.
        </p>
      )}
    </div>
  );
}
