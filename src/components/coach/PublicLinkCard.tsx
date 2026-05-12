"use client";

import { useState } from "react";

export default function PublicLinkCard({ coachId }: { coachId: string }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined"
    ? `${window.location.origin}/p/${coachId}`
    : `/p/${coachId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined" ? `${window.location.origin}/p/${coachId}` : ""
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  }

  return (
    <div className="card p-5 space-y-3">
      <div>
        <p className="text-white font-semibold text-sm">Página pública</p>
        <p className="text-zinc-500 text-xs mt-0.5">
          Partilha este link com potenciais clientes — vêem o teu perfil e podem registar-se
        </p>
      </div>
      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
        <span className="text-zinc-500 text-xs truncate flex-1 font-mono">/p/{coachId.slice(0, 8)}…</span>
        <button
          onClick={copy}
          className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            copied
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-brand-gold/10 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/20"
          }`}
        >
          {copied ? "✓ Copiado!" : "Copiar link"}
        </button>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        Pré-visualizar página →
      </a>
    </div>
  );
}
