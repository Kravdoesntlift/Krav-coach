"use client";

import { useState, useRef } from "react";

interface Props {
  currentBeforeUrl: string | null;
  currentAfterUrl: string | null;
}

function SlotUpload({
  label,
  slot,
  currentUrl,
}: {
  label: string;
  slot: "before" | "after";
  currentUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("slot", slot);
    const res = await fetch("/api/transformation", { method: "POST", body });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Erro ao enviar foto");
    } else {
      setUrl(json.url);
    }
    setLoading(false);
    e.target.value = "";
  }

  return (
    <div className="flex-1 space-y-2">
      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-center">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative group w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 hover:border-brand-gold/50 transition-colors"
        style={{ aspectRatio: "3/4" }}
      >
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs">{loading ? "A carregar..." : "Adicionar foto"}</span>
          </div>
        )}
        {url && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-semibold">{loading ? "A carregar..." : "Alterar"}</span>
          </div>
        )}
      </button>
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function TransformationUpload({ currentBeforeUrl, currentAfterUrl }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-white text-sm font-semibold">A tua transformação</p>
        <p className="text-zinc-500 text-xs mt-0.5">
          Aparece como slider antes/depois na landing page — motiva novos clientes a aderir.
        </p>
      </div>
      <div className="flex gap-3">
        <SlotUpload label="Antes" slot="before" currentUrl={currentBeforeUrl} />
        <SlotUpload label="Depois" slot="after" currentUrl={currentAfterUrl} />
      </div>
      <p className="text-zinc-600 text-xs">Formatos: JPG, PNG, WEBP · Máx. 5MB por foto</p>
    </div>
  );
}
