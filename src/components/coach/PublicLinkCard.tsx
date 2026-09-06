"use client";

import { useState } from "react";

export default function PublicLinkCard({ coachId, slug }: { coachId: string; slug?: string | null }) {
  const [copied, setCopied] = useState(false);

  const path = slug ? `/p/${slug}` : `/p/${coachId}`;
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
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
          Partilha este link com potenciais clientes, vêem o teu perfil e podem registar-se
        </p>
      </div>

      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
        <span className="text-zinc-400 text-xs truncate flex-1 font-mono">{path}</span>
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

      {!slug && (
        <p className="text-zinc-600 text-[11px] px-0.5">
          Define um slug no teu perfil para teres um link mais limpo para anúncios
        </p>
      )}

      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        Pré-visualizar página →
      </a>
    </div>
  );
}
