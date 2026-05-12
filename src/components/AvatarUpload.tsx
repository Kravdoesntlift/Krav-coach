"use client";

import { useState, useRef } from "react";

interface Props {
  userId: string;
  currentUrl: string | null;
  fullName: string;
}

export default function AvatarUpload({ currentUrl, fullName }: Props) {
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

    const res = await fetch("/api/avatar", { method: "POST", body });
    const json = await res.json();

    if (!res.ok || json.error) {
      setError(json.error ?? "Erro ao enviar foto");
      setLoading(false);
      return;
    }

    setUrl(json.url);
    setLoading(false);
  }

  const initials = fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="relative group"
      >
        {url ? (
          <img
            src={url}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 group-hover:border-brand-gold transition-colors"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 group-hover:border-brand-gold transition-colors flex items-center justify-center text-white font-bold text-xl">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">{loading ? "..." : "Alterar"}</span>
        </div>
      </button>

      <div>
        <p className="text-white font-semibold">{fullName}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-gray-500 hover:text-brand-gold transition-colors mt-0.5"
        >
          {loading ? "A carregar..." : "Alterar foto"}
        </button>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

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
