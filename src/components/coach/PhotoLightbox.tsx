"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
}

interface Props {
  photos: Photo[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PhotoLightbox({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => i !== null ? (i - 1 + photos.length) % photos.length : null), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => i !== null ? (i + 1) % photos.length : null), [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, close, prev, next]);

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const lightbox = currentPhoto && mounted ? createPortal(
    <div
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 9999, background: "#000" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header — always visible */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <p className="text-white text-sm font-semibold">{currentPhoto.caption ?? "Foto de progresso"}</p>
          <p className="text-zinc-500 text-xs">{formatDate(currentPhoto.taken_at)}</p>
        </div>
        <button
          onClick={close}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
          style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)" }}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Scrollable photo */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
        <Image
          src={currentPhoto.photo_url}
          alt={currentPhoto.caption ?? "Foto"}
          width={900}
          height={1200}
          className="w-full rounded-2xl object-contain"
          style={{ maxWidth: 560 }}
          priority
        />
      </div>

      {/* Footer nav — always visible */}
      {photos.length > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={prev} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: "#C9A84C" }}>← Anterior</button>
          <span className="text-zinc-500 text-sm">{(lightboxIndex ?? 0) + 1} / {photos.length}</span>
          <button onClick={next} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: "#C9A84C" }}>Seguinte →</button>
        </div>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative rounded-2xl overflow-hidden bg-zinc-900 group block text-left w-full"
            aria-label={`Ver foto de ${formatDate(photo.taken_at)}`}
          >
            <div className="relative w-full" style={{ paddingBottom: "75%" }}>
              <Image
                src={photo.photo_url}
                alt={photo.caption ?? "Foto de progresso"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs font-medium">{formatDate(photo.taken_at)}</p>
              {photo.caption && <p className="text-gray-300 text-[11px] truncate">{photo.caption}</p>}
            </div>
          </button>
        ))}
      </div>

      {lightbox}
    </>
  );
}
