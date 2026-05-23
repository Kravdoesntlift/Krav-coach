"use client";

import { useState } from "react";

interface Device {
  id: string;
  subscribedAt: string;
  endpoint: string;
}

interface VapidInfo {
  ok: boolean;
  subject: string | null;
  publicKey: string | null;
  privateKey: string;
  error: string | null;
}

interface DebugInfo {
  userId: string;
  deviceCount: number;
  devices: Device[];
  vapid: VapidInfo;
}

export default function PushDebugPanel() {
  const [info, setInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function fetchDebug() {
    setLoading(true);
    try {
      const res = await fetch("/api/push/debug");
      const json = await res.json();
      setInfo(json);
    } catch {
      setTestResult("❌ Erro ao carregar diagnóstico.");
    }
    setLoading(false);
  }

  async function sendTest() {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/push/debug", { method: "POST" });
      const json = await res.json();
      setTestResult(json.ok ? "✅ Notificação enviada! Deves recebê-la agora." : `❌ Erro: ${json.error}`);
    } catch {
      setTestResult("❌ Erro de rede.");
    }
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
          <Row label="VAPID configurado" value={info.vapid.ok} />
          {info.vapid.error && (
            <p className="text-red-400 text-[11px] px-1">{info.vapid.error}</p>
          )}
          <Row label="Dispositivos subscritos" value={info.deviceCount > 0} />
          <div className="flex items-center justify-between py-1 border-b border-zinc-800">
            <span className="text-gray-500">Total de dispositivos</span>
            <span className="text-gray-300">{info.deviceCount}</span>
          </div>
          {info.devices.map((d) => (
            <div key={d.id} className="py-1 border-b border-zinc-800 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subscrito em</span>
                <span className="text-gray-300">{new Date(d.subscribedAt).toLocaleString("pt-PT")}</span>
              </div>
              <p className="text-gray-600 font-mono text-[10px] truncate">{d.endpoint}</p>
            </div>
          ))}
          {info.vapid.subject && (
            <div className="flex items-center justify-between py-1 border-b border-zinc-800">
              <span className="text-gray-500">VAPID subject</span>
              <span className="text-gray-300 text-[10px] truncate max-w-[160px]">{info.vapid.subject}</span>
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
          <p className="text-xs text-center" style={{ color: testResult.startsWith("✅") ? "#C9A84C" : "#f87171" }}>
            {testResult}
          </p>
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
