"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  aspectRatio = "3/4",
}: Props) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl select-none touch-none cursor-ew-resize"
      style={{ aspectRatio }}
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => updatePos(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); updatePos(e.touches[0].clientX); }}
    >
      {/* After image: full width base */}
      <Image src={afterUrl} alt={afterLabel} fill className="object-cover pointer-events-none" />

      {/* Before image: clipped to left portion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image src={beforeUrl} alt={beforeLabel} fill className="object-cover" />
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        {/* Drag handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="8 8 4 12 8 16" />
            <polyline points="16 8 20 12 16 16" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 pointer-events-none text-[11px] font-black tracking-widest uppercase text-white px-2.5 py-1 rounded-lg"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 pointer-events-none text-[11px] font-black tracking-widest uppercase text-white px-2.5 py-1 rounded-lg"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
        {afterLabel}
      </span>
    </div>
  );
}
