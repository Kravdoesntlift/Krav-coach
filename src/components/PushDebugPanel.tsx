"use client";

import { useState } from "react";

interface DebugInfo {
  userId: string;
  hasSubscription: boolean;
  subscribedAt: string | null;
  totalSubscriptionsInDB: number;
  coachIds: string[];
  coachSubscriptionStatus: Record<string, boolean>;
  vapidConfigured: boolean;
}

export default function PushDebugPanel() {
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function fetchDebug() {
    setLoading(true);
    const res = await fetch("/api/push/debug");
    const json = await res.json();
    setInfo(json);
    setLoading(false);
  }

  async function sendTest() {
    setLoading(true);
    setTestResult(null);
    const res = await fetch("/api/push/debug", { method: "POST" });
    const json = await res.json();
    setTestResult(json.ok ? "✅ Notificação enviada! Deves recebê-la agora." : `❌ Erro: ${json.error}`);
    setLoading(false);
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">Diagnóstico de notificações</p>
        <button
          onClick={fetchDebug}
          disabled={loading}
          className="px-3 py-1 rounded-lg bg-zinc-700 text-gray-300 text-xs hover:bg-zinc-600 transition-colors"
        >
          {loading ? "..." : "Verificar estado"}
        </button>
      </div>

      {info && (
        <div className="space-y-2 text-xs">
          <Row label="VAPID configurado" value={info.vapidConfigured} />
          <Row label="Tens subscrição push" value={info.hasSubscription} />
          {info.subscribedAt && (
            <div className="flex items-center justify-between py-1 border-b border-zinc-800">
              <span className="text-gray-500">Subscrito em</span>
              <span className="text-gray-300">{new Date(info.subscribedAt).toLocaleString("pt-PT")}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-1 border-b border-zinc-800">
            <span className="text-gray-500">Total subscrições na DB</span>
            <span className="text-gray-300">{info.totalSubscriptionsInDB}</span>
          </div>
          {info.coachIds.length > 0 && (
            <div className="py-1">
              <p className="text-gray-500 mb-1">Coaches com plano atribuído:</p>
              {info.coachIds.map((id) => (
                <div key={id} className="flex items-center justify-between py-0.5">
                  <span className="text-gray-600 font-mono text-[10px]">{id.slice(0, 8)}…</span>
                  <span className={info.coachSubscriptionStatus[id] ? "text-green-400" : "text-red-400"}>
                    {info.coachSubscriptionStatus[id] ? "✓ Subscrito" : "✗ Sem subscrição"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={sendTest}
          disabled={loading}
          className="w-full py-2 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-semibold hover:bg-brand-gold/20 transition-colors disabled:opacity-40"
        >
          📨 Enviar notificação de teste para mim
        </button>
        {testResult && (
          <p className="text-xs text-center text-gray-400">{testResult}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-zinc-800">
      <span className="text-gray-500">{label}</span>
      <span className={value ? "text-green-400" : "text-red-400"}>
        {value ? "✓ Sim" : "✗ Não"}
      </span>
    </div>
  );
}
