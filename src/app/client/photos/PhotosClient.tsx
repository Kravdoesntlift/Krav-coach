"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProgressPhoto } from "@/lib/supabase/types";

// ─── Before/After drag slider ─────────────────────────────────────────────────
function PhotoCompareSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const [pos, setPos] = useState(50); // 0–100 %

  const fmt = (p: ProgressPhoto) =>
    new Date(p.taken_at + "T00:00:00").toLocaleDateString("pt-PT", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="space-y-3">
      {/* Slider container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{ aspectRatio: "3/4", background: "#0a0a0a" }}
      >
        {/* BEFORE — full, underneath */}
        <img
          src={before.photo_url}
          alt="Antes"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* AFTER — clipped from left */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={after.photo_url}
            alt="Depois"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${pos}%`, background: "rgba(255,255,255,0.9)", pointerEvents: "none" }}
        >
          {/* Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-xl"
            style={{
              background: "linear-gradient(135deg,#E2C060,#A8893A)",
              border: "2px solid rgba(255,255,255,0.8)",
            }}
          >
            <span className="text-black text-xs font-black select-none">⇄</span>
          </div>
        </div>

        {/* Invisible range input for drag interaction */}
        <input
          type="range" min={0} max={100} value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          style={{ zIndex: 10 }}
        />

        {/* Corner labels */}
        <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold pointer-events-none">
          Antes
        </div>
        <div
          className="absolute top-3 right-3 text-black text-[10px] px-2.5 py-1 rounded-full font-bold pointer-events-none"
          style={{ background: "rgba(201,168,76,0.9)" }}
        >
          Depois
        </div>

        {/* Date labels */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none">
          {fmt(before)}
        </div>
        <div
          className="absolute bottom-3 right-3 text-black text-[10px] px-2 py-0.5 rounded-full pointer-events-none"
          style={{ background: "rgba(201,168,76,0.8)" }}
        >
          {fmt(after)}
        </div>
      </div>

      {/* Captions */}
      {(before.caption || after.caption) && (
        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 text-center">
          <p>{before.caption ?? "—"}</p>
          <p>{after.caption ?? "—"}</p>
        </div>
      )}

      {/* Reset hint */}
      <p className="text-zinc-700 text-[10px] text-center">
        Arrasta para comparar ← →
      </p>
    </div>
  );
}

interface Props {
  clientId: string;
  initialPhotos: ProgressPhoto[];
}

export default function PhotosClient({ clientId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lightbox, setLightbox] = useState<ProgressPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<ProgressPhoto | null>(null);
  const [compareB, setCompareB] = useState<ProgressPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadError(null);
  }

  function handleCancel() {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("caption", caption.trim());

    const res = await fetch("/api/photos/upload", { method: "POST", body });
    const json = await res.json();

    if (!res.ok || json.error) {
      setUploadError(`Erro ao enviar: ${json.error ?? "tenta novamente"}`);
      setUploading(false);
      return;
    }

    setPhotos((prev) => [json.photo as ProgressPhoto, ...prev]);
    handleCancel();
    setUploading(false);
  }

  async function deletePhoto(id: string, photoUrl: string) {
    const supabase = createClient();
    const path = photoUrl.split("/progress-photos/")[1];
    if (path) await supabase.storage.from("progress-photos").remove([path]);
    await supabase.from("progress_photos").delete().eq("id", id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (lightbox?.id === id) setLightbox(null);
  }

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <div className="card p-5 space-y-4">
        <p className="text-white font-semibold text-sm">Adicionar foto</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full max-h-[70vh] object-contain rounded-xl bg-zinc-950" />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda (ex: Semana 4, frente)..."
              className="input text-sm"
              maxLength={80}
            />
            {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-400 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {uploading ? "A enviar..." : "Guardar foto"}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span className="text-4xl">📸</span>
            <span className="text-sm font-medium">Escolher foto</span>
            <span className="text-xs text-gray-600">Câmara ou galeria</span>
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                {lightbox.caption && <p className="text-white font-medium text-sm">{lightbox.caption}</p>}
                <p className="text-gray-500 text-xs">
                  {new Date(lightbox.taken_at + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="w-9 h-9 rounded-full bg-zinc-800 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>
            <img src={lightbox.photo_url} alt={lightbox.caption ?? ""} className="w-full rounded-2xl max-h-[70vh] object-contain" />
            <button
              onClick={() => deletePhoto(lightbox.id, lightbox.photo_url)}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              Apagar foto
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {photos.length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center space-y-5"
          style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
          >
            <span className="text-4xl">📸</span>
          </div>
          <div>
            <p className="text-white font-bold text-base">Sem fotos de progresso</p>
            <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
              Regista a tua evolução com fotos. Um antes e depois vale mais que mil palavras.
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-primary text-sm mx-auto"
          >
            📸 Adicionar primeira foto
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs">{photos.length} foto{photos.length !== 1 ? "s" : ""} · toca para ampliar</p>
            {photos.length >= 2 && (
              <button
                onClick={() => { setCompareMode((v) => !v); setCompareA(null); setCompareB(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${compareMode ? "bg-brand-gold text-black" : "bg-zinc-800 text-gray-400 hover:text-white"}`}
              >
                ⇄ Antes/Depois
              </button>
            )}
          </div>

          {compareMode && (
            <div className="card p-4 space-y-3">
              {(!compareA || !compareB) ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-brand-gold text-xs font-semibold">
                    {!compareA ? "① Seleciona a foto 'Antes'" : "② Agora seleciona a foto 'Depois'"}
                  </p>
                  <p className="text-zinc-700 text-xs">Toca numa foto abaixo para escolher</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <PhotoCompareSlider before={compareA} after={compareB} />
                  <button
                    onClick={() => { setCompareA(null); setCompareB(null); }}
                    className="w-full py-2.5 bg-zinc-800 text-gray-400 rounded-xl text-xs hover:bg-zinc-700 transition-colors"
                  >
                    Escolher outras fotos
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => {
              const isSelectedA = compareA?.id === photo.id;
              const isSelectedB = compareB?.id === photo.id;
              return (
                <button
                  key={photo.id}
                  onClick={() => {
                    if (compareMode) {
                      if (!compareA) { setCompareA(photo); return; }
                      if (!compareB && photo.id !== compareA.id) { setCompareB(photo); return; }
                      return;
                    }
                    setLightbox(photo);
                  }}
                  className={`relative rounded-2xl overflow-hidden bg-zinc-900 group focus:outline-none transition-all ${
                    isSelectedA ? "ring-2 ring-white" : isSelectedB ? "ring-2 ring-brand-gold" : compareMode ? "hover:ring-2 hover:ring-white/50" : "focus:ring-2 focus:ring-brand-gold"
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption ?? "Foto de progresso"}
                    className="w-full object-contain max-h-72"
                  />
                  {(isSelectedA || isSelectedB) && (
                    <div className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${isSelectedA ? "bg-white text-black" : "bg-brand-gold text-black"}`}>
                      {isSelectedA ? "Antes" : "Depois"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs font-medium">
                      {new Date(photo.taken_at + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {photo.caption && (
                      <p className="text-gray-300 text-[11px] truncate">{photo.caption}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
