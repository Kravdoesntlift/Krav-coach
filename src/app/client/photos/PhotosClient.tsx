"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { ProgressPhoto } from "@/lib/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type Angle = "front" | "side" | "back";
type Session = { date: string; photos: Partial<Record<Angle, ProgressPhoto>> };

const ANGLES: { key: Angle; label: string; icon: string }[] = [
  { key: "front", label: "Frente",  icon: "🧍" },
  { key: "side",  label: "Lado",    icon: "🧍" },
  { key: "back",  label: "Costas",  icon: "🧍" },
];

// ─── Group photos into sessions by date ───────────────────────────────────────
function groupBySessions(photos: ProgressPhoto[]): Session[] {
  const map = new Map<string, Partial<Record<Angle, ProgressPhoto>>>();
  for (const p of photos) {
    if (!map.has(p.taken_at)) map.set(p.taken_at, {});
    const angle = p.angle as Angle | null;
    if (angle) map.get(p.taken_at)![angle] = p;
    else {
      // Legacy unstructured photos — slot as "front" if empty
      const slot = map.get(p.taken_at)!;
      if (!slot.front) slot.front = p;
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, photos]) => ({ date, photos }));
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Angle slot in upload card ────────────────────────────────────────────────
function UploadSlot({
  angle, preview, onSelect, onClear,
}: {
  angle: typeof ANGLES[number];
  preview: string | null;
  onSelect: (file: File, preview: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelect(file, URL.createObjectURL(file));
  }

  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-widest text-center">
        {angle.label}
      </p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden bg-zinc-950" style={{ aspectRatio: "3/4" }}>
          <Image src={preview} alt={angle.label} fill className="object-cover" />
          <button
            onClick={() => { onClear(); if (ref.current) ref.current.value = ""; }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black transition-colors"
            aria-label="Remover foto"
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl flex flex-col items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors"
          style={{ aspectRatio: "3/4" }}
        >
          <span className="text-2xl">📸</span>
          <span className="text-[10px]">Adicionar</span>
        </button>
      )}
    </div>
  );
}

// ─── Drag slider for a single angle pair ──────────────────────────────────────
function AngleSlider({
  beforeUrl,
  afterUrl,
  label,
}: {
  beforeUrl: string | null;
  afterUrl: string | null;
  label: string;
}) {
  const [pos, setPos] = useState(50); // 0–100 %
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => { if (dragging.current) updatePos(ev.clientX); };
    const onUp   = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const onMove = (ev: TouchEvent) => updatePos(ev.touches[0].clientX);
    const onEnd  = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  };

  if (!beforeUrl && !afterUrl) {
    return (
      <div className="rounded-xl overflow-hidden bg-zinc-950 relative flex items-center justify-center text-zinc-800 text-xs" style={{ aspectRatio: "3/4" }}>
        —
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="text-[9px] text-zinc-700 bg-black/60 px-1.5 py-0.5 rounded-full">{label}</span>
        </div>
      </div>
    );
  }

  if (!beforeUrl || !afterUrl) {
    const url  = beforeUrl ?? afterUrl!;
    const badge = beforeUrl ? "Antes" : "Depois";
    const goldBadge = !beforeUrl;
    return (
      <div className="rounded-xl overflow-hidden bg-zinc-950 relative" style={{ aspectRatio: "3/4" }}>
        <img src={url} alt={label} className="w-full h-full object-cover" draggable={false} />
        <div className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${goldBadge ? "text-black" : "bg-black/70 text-white"}`}
          style={goldBadge ? { background: "rgba(201,168,76,0.9)" } : undefined}>
          {badge}
        </div>
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="text-[9px] text-zinc-500 bg-black/60 px-1.5 py-0.5 rounded-full">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden relative select-none cursor-col-resize"
      style={{ aspectRatio: "3/4", touchAction: "none" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* After (full) */}
      <img src={afterUrl} alt={`${label} depois`} className="absolute inset-0 w-full h-full object-cover" draggable={false} />

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={beforeUrl} alt={`${label} antes`} className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: "none" }} draggable={false} />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.8)]"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2L1 6L4 10" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2L11 6L8 10" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      {pos > 15 && (
        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold pointer-events-none">
          Antes
        </div>
      )}
      {pos < 85 && (
        <div
          className="absolute top-1.5 right-1.5 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold pointer-events-none"
          style={{ background: "rgba(201,168,76,0.9)" }}
        >
          Depois
        </div>
      )}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
        <span className="text-[9px] text-zinc-400 bg-black/60 px-1.5 py-0.5 rounded-full">{label}</span>
      </div>
    </div>
  );
}

// ─── Side-by-side session comparison with drag sliders ────────────────────────
function SessionCompare({ before, after }: { before: Session; after: Session }) {
  return (
    <div className="space-y-3">
      {/* Labels row */}
      <div className="grid grid-cols-3 gap-2">
        {ANGLES.map((a) => (
          <p key={a.key} className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest text-center">
            {a.label}
          </p>
        ))}
      </div>

      {/* Sliders row */}
      <div className="grid grid-cols-3 gap-2">
        {ANGLES.map((a) => (
          <AngleSlider
            key={a.key}
            label={a.label}
            beforeUrl={before.photos[a.key]?.photo_url ?? null}
            afterUrl={after.photos[a.key]?.photo_url ?? null}
          />
        ))}
      </div>

      <p className="text-zinc-700 text-[10px] text-center">
        {fmtDate(before.date)} → {fmtDate(after.date)} · Arrasta para comparar
      </p>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────
function SessionCard({
  session, onLightbox, compareMode, isSelected, onSelect,
}: {
  session: Session;
  onLightbox: (p: ProgressPhoto) => void;
  compareMode: boolean;
  isSelected: "A" | "B" | null;
  onSelect: () => void;
}) {
  const photoCount = ANGLES.filter((a) => session.photos[a.key]).length;

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all ${
        compareMode ? "cursor-pointer" : ""
      } ${
        isSelected === "A" ? "ring-2 ring-white" :
        isSelected === "B" ? "ring-2 ring-brand-gold" :
        compareMode ? "hover:ring-2 hover:ring-white/40" : ""
      }`}
      style={{ background: "rgba(18,18,20,0.85)", border: "1px solid rgba(255,255,255,0.06)" }}
      onClick={compareMode ? onSelect : undefined}
    >
      {/* Date header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-800/60">
        <p className="text-white text-xs font-semibold">{fmtDate(session.date)}</p>
        <div className="flex items-center gap-2">
          {isSelected && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isSelected === "A" ? "bg-white text-black" : "bg-brand-gold text-black"
            }`}>
              {isSelected === "A" ? "Antes" : "Depois"}
            </span>
          )}
          <span className="text-zinc-600 text-[10px]">{photoCount}/3</span>
        </div>
      </div>

      {/* 3 angle slots */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/40">
        {ANGLES.map((a) => {
          const photo = session.photos[a.key];
          return (
            <div key={a.key} className="relative bg-zinc-950" style={{ aspectRatio: "3/4" }}>
              {photo ? (
                <button
                  className="w-full h-full focus:outline-none"
                  onClick={!compareMode ? (e) => { e.stopPropagation(); onLightbox(photo); } : undefined}
                >
                  <img
                    src={photo.photo_url}
                    alt={a.label}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800 text-xs">
                  —
                </div>
              )}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-[9px] text-zinc-600 bg-black/60 px-1.5 py-0.5 rounded-full">
                  {a.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  clientId: string;
  initialPhotos: ProgressPhoto[];
}

export default function PhotosClient({ clientId, initialPhotos }: Props) {
  const [photos, setPhotos]         = useState<ProgressPhoto[]>(initialPhotos);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightbox, setLightbox]     = useState<ProgressPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [sessionA, setSessionA]     = useState<Session | null>(null);
  const [sessionB, setSessionB]     = useState<Session | null>(null);

  // Per-angle file + preview state
  const [files, setFiles]     = useState<Partial<Record<Angle, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Angle, string>>>({});

  const sessions = groupBySessions(photos);
  const hasAnySlot = Object.keys(files).length > 0;

  function setAngleFile(angle: Angle, file: File, preview: string) {
    setFiles((p) => ({ ...p, [angle]: file }));
    setPreviews((p) => ({ ...p, [angle]: preview }));
    setUploadError(null);
  }

  function clearAngle(angle: Angle) {
    setFiles((p) => { const n = { ...p }; delete n[angle]; return n; });
    setPreviews((p) => { const n = { ...p }; delete n[angle]; return n; });
  }

  function resetUpload() {
    setFiles({});
    setPreviews({});
    setUploadError(null);
  }

  async function handleSubmit() {
    if (!hasAnySlot) return;
    setUploading(true);
    setUploadError(null);

    const today = new Date();
    const taken_at = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const newPhotos: ProgressPhoto[] = [];

    for (const [angle, file] of Object.entries(files) as [Angle, File][]) {
      const body = new FormData();
      body.append("file", file);
      body.append("angle", angle);
      body.append("caption", "");

      const res  = await fetch("/api/photos/upload", { method: "POST", body });
      const json = await res.json();

      if (!res.ok || json.error) {
        setUploadError(`Erro ao enviar ${angle}: ${json.error ?? "tenta novamente"}`);
        setUploading(false);
        return;
      }
      newPhotos.push(json.photo as ProgressPhoto);
    }

    setPhotos((prev) => [...newPhotos, ...prev]);
    resetUpload();
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

  function handleSessionSelect(session: Session) {
    if (!sessionA) { setSessionA(session); return; }
    if (!sessionB && session.date !== sessionA.date) { setSessionB(session); return; }
  }

  function getSelectedLabel(session: Session): "A" | "B" | null {
    if (sessionA?.date === session.date) return "A";
    if (sessionB?.date === session.date) return "B";
    return null;
  }

  return (
    <div className="space-y-6">

      {/* ── Upload card ──────────────────────────────────────────────────── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm">Nova sessão de fotos</p>
          {hasAnySlot && (
            <button onClick={resetUpload} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              Limpar
            </button>
          )}
        </div>

        {/* 3 angle slots */}
        <div className="flex gap-3">
          {ANGLES.map((a) => (
            <UploadSlot
              key={a.key}
              angle={a}
              preview={previews[a.key] ?? null}
              onSelect={(file, preview) => setAngleFile(a.key, file, preview)}
              onClear={() => clearAngle(a.key)}
            />
          ))}
        </div>

        <p className="text-zinc-700 text-[10px] text-center">
          Podes adicionar 1, 2 ou as 3 vistas — não é obrigatório fazer todas
        </p>

        {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}

        <button
          onClick={handleSubmit}
          disabled={!hasAnySlot || uploading}
          className="w-full py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors disabled:opacity-30"
        >
          {uploading ? "A guardar..." : "Guardar sessão"}
        </button>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-sm w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm capitalize">
                  {lightbox.angle === "front" ? "Frente" : lightbox.angle === "side" ? "Lado" : lightbox.angle === "back" ? "Costas" : ""}
                  {lightbox.caption ? ` · ${lightbox.caption}` : ""}
                </p>
                <p className="text-gray-500 text-xs">{fmtDate(lightbox.taken_at)}</p>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="w-9 h-9 rounded-full bg-zinc-800 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors"
                aria-label="Fechar"
              >✕</button>
            </div>
            <Image src={lightbox.photo_url} alt="" width={800} height={600} className="w-full rounded-2xl max-h-[70vh] object-contain" />
            <button
              onClick={() => deletePhoto(lightbox.id, lightbox.photo_url)}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              Apagar foto
            </button>
          </div>
        </div>
      )}

      {/* ── Sessions list ─────────────────────────────────────────────────── */}
      {sessions.length === 0 ? (
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
              Regista a tua evolução com fotos de frente, lado e costas.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs">
              {sessions.length} sessão{sessions.length !== 1 ? "ões" : ""}
            </p>
            {sessions.length >= 2 && (
              <button
                onClick={() => {
                  setCompareMode((v) => !v);
                  setSessionA(null);
                  setSessionB(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  compareMode ? "bg-brand-gold text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                ⇄ Comparar
              </button>
            )}
          </div>

          {/* Compare panel */}
          {compareMode && (
            <div className="card p-4 space-y-3">
              {!sessionA ? (
                <p className="text-brand-gold text-xs font-semibold text-center py-2">
                  ① Toca numa sessão para definir o "Antes"
                </p>
              ) : !sessionB ? (
                <p className="text-brand-gold text-xs font-semibold text-center py-2">
                  ② Agora seleciona o "Depois"
                </p>
              ) : (
                <div className="space-y-4">
                  <SessionCompare before={sessionA} after={sessionB} />
                  <button
                    onClick={() => { setSessionA(null); setSessionB(null); }}
                    className="w-full py-2.5 bg-zinc-800 text-gray-400 rounded-xl text-xs hover:bg-zinc-700 transition-colors"
                  >
                    Escolher outras sessões
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Session cards */}
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.date}
                session={session}
                onLightbox={setLightbox}
                compareMode={compareMode}
                isSelected={getSelectedLabel(session)}
                onSelect={() => handleSessionSelect(session)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
