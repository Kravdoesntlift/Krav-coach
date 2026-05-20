"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  clientName: string;
}

type Step = "idle" | "confirm1" | "confirm2" | "loading" | "done" | "error";

export default function RefundAndCancelButton({ clientId, clientName }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ message: string; refunded: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const firstName = clientName.split(" ")[0];

  async function execute() {
    setStep("loading");
    try {
      const res = await fetch("/api/stripe/refund-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json() as { cancelled?: boolean; refunded?: boolean; message?: string; error?: string };
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Erro desconhecido.");
        setStep("error");
      } else {
        setResult({ message: data.message ?? "", refunded: data.refunded ?? false });
        setStep("done");
        router.refresh();
      }
    } catch {
      setErrorMsg("Erro de rede. Tenta novamente.");
      setStep("error");
    }
  }

  function reset() {
    setStep("idle");
    setTyped("");
    setErrorMsg(null);
    setResult(null);
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm1")}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        Reembolsar e cancelar conta
      </button>
    );
  }

  // ── CONFIRM STEP 1 ─────────────────────────────────────────────────────────────
  if (step === "confirm1") {
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-red-400 font-bold text-sm">Cancelar conta de {firstName}?</p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Isto vai <strong className="text-white">cancelar a subscrição Stripe</strong> e emitir um reembolso do último pagamento. O cliente perde acesso imediatamente.
          </p>
        </div>
        <ul className="space-y-1.5 text-xs text-zinc-500">
          <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Subscrição cancelada no Stripe</li>
          <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Reembolso do último pagamento iniciado</li>
          <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✕</span> Acesso à app revogado</li>
          <li className="flex items-start gap-2"><span className="text-zinc-600 mt-0.5">→</span> Histórico e dados mantidos</li>
        </ul>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => setStep("confirm2")}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-colors"
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIRM STEP 2 ─────────────────────────────────────────────────────────────
  if (step === "confirm2") {
    const valid = typed.trim().toUpperCase() === "CONFIRMAR";
    return (
      <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-red-400 font-bold text-sm">Confirmação final</p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Escreve <strong className="text-white">CONFIRMAR</strong> para executar o cancelamento e reembolso de {firstName}.
          </p>
        </div>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="CONFIRMAR"
          autoFocus
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors placeholder-zinc-600 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={execute}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Reembolsar e cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="rounded-2xl border border-zinc-800 p-5 flex items-center justify-center gap-3 text-zinc-400 text-sm">
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        A processar no Stripe...
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 space-y-2">
        <p className="text-green-400 font-bold text-sm">
          {result.refunded ? "✓ Reembolso iniciado" : "✓ Conta cancelada"}
        </p>
        <p className="text-zinc-400 text-xs leading-relaxed">{result.message}</p>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
        <p className="text-red-400 font-bold text-sm">Erro</p>
        <p className="text-zinc-400 text-xs leading-relaxed">{errorMsg}</p>
        <button onClick={reset} className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Voltar
        </button>
      </div>
    );
  }

  return null;
}
