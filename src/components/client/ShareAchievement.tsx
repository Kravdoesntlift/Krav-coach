"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface Props {
  title: string;
  description: string;
  icon: string;
  clientName: string;
}

type Stage = "idle" | "reveal" | "image";

export default function ShareAchievement({ title, description, icon, clientName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render portal on client
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (stage !== "idle") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [stage]);

  function close() {
    setStage("idle");
    setImageUrl(null);
  }

  async function generateImage() {
    setGenerating(true);
    const canvas = canvasRef.current!;
    const size = 1080;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Background
    const bg = ctx.createLinearGradient(0, 0, size, size);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(1, "#160f02");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    // Gold border
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 5;
    roundRect(ctx, 28, 28, size - 56, size - 56, 44);
    ctx.stroke();

    // Inner subtle border
    ctx.strokeStyle = "rgba(201,168,76,0.1)";
    ctx.lineWidth = 1;
    roundRect(ctx, 50, 50, size - 100, size - 100, 32);
    ctx.stroke();

    // Radial glow
    const grd = ctx.createRadialGradient(size / 2, 420, 0, size / 2, 420, 260);
    grd.addColorStop(0, "rgba(201,168,76,0.16)");
    grd.addColorStop(1, "rgba(201,168,76,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(size / 2, 420, 260, 0, Math.PI * 2);
    ctx.fill();

    // Logo
    ctx.font = "bold 56px system-ui";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("KRAV", size / 2 - 24, 150);
    ctx.fillStyle = "#C9A84C";
    ctx.fillText(".", size / 2 + 72, 150);

    // Icon
    ctx.font = "220px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(icon, size / 2, 520);

    // Title
    ctx.font = "bold 78px system-ui";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    wrapText(ctx, title, size / 2, 660, size - 160, 90);

    // Description
    ctx.font = "38px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    wrapText(ctx, description, size / 2, 780, size - 220, 52);

    // Divider
    ctx.strokeStyle = "rgba(201,168,76,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, 880);
    ctx.lineTo(size - 180, 880);
    ctx.stroke();

    // Name
    ctx.font = "bold 36px system-ui";
    ctx.fillStyle = "#C9A84C";
    ctx.textAlign = "center";
    ctx.fillText(clientName, size / 2, 940);

    // Date
    ctx.font = "28px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillText(new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }), size / 2, 990);

    const url = canvas.toDataURL("image/png");
    setImageUrl(url);
    setGenerating(false);
    setStage("image");
  }

  function download() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `conquista-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  }

  async function shareNative() {
    if (!imageUrl) return;
    const blob = await (await fetch(imageUrl)).blob();
    const file = new File([blob], "conquista.png", { type: "image/png" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `Conquista KRAV: ${title}` });
    } else {
      download();
    }
  }

  const modal = stage !== "idle" && mounted ? createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-5 overflow-y-auto"
      style={{
        zIndex: 9999,
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(8px)",
        animation: "sa-fadein 0.2s ease both",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Close button: always visible */}
      <button
        onClick={close}
        className="fixed top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10000 }}
      >
        ✕
      </button>

      {stage === "reveal" && (
        <div
          className="flex flex-col items-center w-full max-w-xs"
          style={{ animation: "sa-scalein 0.38s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {/* Achievement card */}
          <div
            className="relative w-full rounded-3xl p-8 flex flex-col items-center gap-5 overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #1a1505 0%, #0d0d0d 100%)",
              border: "1px solid rgba(201,168,76,0.4)",
              boxShadow: "0 0 60px rgba(201,168,76,0.1), 0 32px 64px rgba(0,0,0,0.8)",
            }}
          >
            {/* Gold glow behind icon */}
            <div
              className="absolute inset-x-0 top-0 h-48 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,168,76,0.16), transparent)",
              }}
            />

            {/* Brand */}
            <p className="text-xs font-black tracking-[0.25em] text-zinc-600 uppercase relative z-10">
              KRAV<span className="text-brand-gold">.</span>
            </p>

            {/* Icon */}
            <span
              className="relative z-10 leading-none select-none"
              style={{ fontSize: "100px", filter: "drop-shadow(0 4px 24px rgba(201,168,76,0.28))" }}
            >
              {icon}
            </span>

            {/* Text */}
            <div className="text-center space-y-2 relative z-10">
              <p className="text-white text-2xl font-black tracking-tight leading-tight">{title}</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.28), transparent)" }} />

            {/* Client name */}
            <p className="text-brand-gold text-sm font-bold tracking-wide relative z-10">{clientName}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5 w-full">
            <button
              onClick={close}
              className="flex-1 py-3 rounded-2xl text-zinc-400 text-sm font-medium transition-colors hover:text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Fechar
            </button>
            <button
              onClick={generateImage}
              disabled={generating}
              className="flex-1 py-3 rounded-2xl text-black text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #E8C96B, #C9A84C)", boxShadow: "0 4px 20px rgba(201,168,76,0.28)" }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  A gerar...
                </span>
              ) : "Gerar imagem"}
            </button>
          </div>
        </div>
      )}

      {stage === "image" && imageUrl && (
        <div
          className="flex flex-col items-center w-full max-w-xs space-y-4"
          style={{ animation: "sa-scalein 0.25s ease both" }}
        >
          <Image src={imageUrl} alt="Conquista" width={0} height={0} sizes="100vw" className="w-full rounded-2xl shadow-2xl" style={{ height: "auto" }} />
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setStage("reveal")}
              className="flex-1 py-3 rounded-2xl text-zinc-400 text-sm font-medium transition-colors hover:text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              ← Voltar
            </button>
            <button
              onClick={download}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Guardar
            </button>
            <button
              onClick={shareNative}
              className="flex-1 py-3 rounded-2xl text-black text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #E8C96B, #C9A84C)", boxShadow: "0 4px 20px rgba(201,168,76,0.28)" }}
            >
              Partilhar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes sa-fadein  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sa-scalein { from { opacity:0; transform:scale(0.82) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <button
        onClick={() => setStage("reveal")}
        className="text-xs text-zinc-500 hover:text-brand-gold transition-colors font-medium"
      >
        Ver
      </button>
      {modal}
    </>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}
