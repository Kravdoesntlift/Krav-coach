"use client";

import { useState, useEffect, useCallback } from "react";
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

  const close = useCallback(() => setLightboxIndex(null), []);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
  }, [photos.length]);

  // Keyboard navigation
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

  // Lock body scroll when open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative rounded-2xl overflow-hidden bg-zinc-900 group block text-left w-full"
            aria-label={`Ver foto de ${formatDate(photo.taken_at)}${photo.caption ? `: ${photo.caption}` : ""}`}
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
              {photo.caption && (
                <p className="text-gray-300 text-[11px] truncate">{photo.caption}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox overlay — scrollable so tall portrait photos are fully visible */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizar foto"
        >
          <div className="min-h-full flex items-center justify-center p-4">
            {/* Content — stop propagation so clicking image doesn't close */}
            <div
              className="relative w-full max-w-lg flex flex-col gap-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">
                    {currentPhoto.caption ?? "Foto de progresso"}
                  </p>
                  <p className="text-zinc-500 text-xs">{formatDate(currentPhoto.taken_at)}</p>
                </div>
                <button
                  onClick={close}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0"
                  style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}
                  aria-label="Fechar lightbox"
                >
                  ✕
                </button>
              </div>

              {/* Image — full width, no height cap so portrait photos render completely */}
              <Image
                src={currentPhoto.photo_url}
                alt={currentPhoto.caption ?? "Foto de progresso"}
                width={900}
                height={1200}
                className="w-full rounded-2xl object-contain"
                priority
              />

              {/* Navigation */}
              {photos.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={prev}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-black transition-colors"
                    style={{ background: "#C9A84C" }}
                    aria-label="Foto anterior"
                  >
                    ← Anterior
                  </button>
                  <span className="text-zinc-500 text-xs">
                    {(lightboxIndex ?? 0) + 1} / {photos.length}
                  </span>
                  <button
                    onClick={next}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-black transition-colors"
                    style={{ background: "#C9A84C" }}
                    aria-label="Próxima foto"
                  >
                    Seguinte →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
