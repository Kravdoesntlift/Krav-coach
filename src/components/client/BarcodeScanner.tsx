"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface FoodResult {
  id: string;
  name: string;
  source?: "local" | "custom" | "off";
  servingSize?: number;
  per100g: {
    calories: number | null; protein: number | null; carbs: number | null; fat: number | null;
    fiber: number | null; sugar: number | null; sodium: number | null;
    vit_c: number | null; vit_d: number | null; vit_b12: number | null;
    calcium: number | null; iron: number | null; potassium: number | null; magnesium: number | null;
  };
}

interface Props {
  onFound: (food: FoodResult) => void;
  onClose: () => void;
}

// BarcodeDetector is not in TS lib yet
interface BarcodeDetectorInstance {
  detect(image: ImageBitmapSource): Promise<{ rawValue: string; format: string }[]>;
}
declare const BarcodeDetector: {
  new(options?: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats(): Promise<string[]>;
};

export default function BarcodeScanner({ onFound, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const [status, setStatus]   = useState<"starting" | "scanning" | "found" | "error">("starting");
  const [message, setMessage] = useState("A iniciar câmara...");
  const [useNative, setUseNative] = useState(false);

  // ── Lookup barcode code via our API ─────────────────────────────────────────
  const lookup = useCallback(async (code: string) => {
    setStatus("found");
    setMessage("Produto encontrado! A carregar...");
    try {
      const res = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok || !data.food) {
        setStatus("error");
        setMessage(data.error ?? "Produto não encontrado na base de dados.");
        return;
      }
      onFound(data.food);
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Tenta novamente.");
    }
  }, [onFound]);

  // ── Native BarcodeDetector (Chrome Android, iOS 16+) ─────────────────────
  const startNativeScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });

      setStatus("scanning");
      setMessage("Aponta para o código de barras");

      const scan = async () => {
        if (!videoRef.current || status === "found") return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            stopCamera();
            await lookup(barcodes[0].rawValue);
            return;
          }
        } catch { /* ignore frame errors */ }
        rafRef.current = requestAnimationFrame(scan);
      };

      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      console.error("[BarcodeScanner] native error:", err);
      setStatus("error");
      setMessage("Não foi possível aceder à câmara.");
    }
  }, [lookup, status]);

  // ── Fallback: canvas-based scan using photo capture ───────────────────────
  const startFallbackScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("scanning");
      setMessage("Aponta para o código de barras e toca em Scan");
    } catch {
      // Camera not available at all — fallback to file input
      setStatus("scanning");
      setMessage("Câmara não disponível. Usa a galeria para fotografar o código.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Manual capture (fallback mode) ───────────────────────────────────────
  const captureAndDecode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    // Try BarcodeDetector on the canvas image
    try {
      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(), "image/jpeg", 0.95);
      });
      const bitmap = await createImageBitmap(blob);
      const barcodes = await detector.detect(bitmap);
      if (barcodes.length > 0) {
        stopCamera();
        await lookup(barcodes[0].rawValue);
        return;
      }
    } catch { /* BarcodeDetector not available */ }

    setStatus("error");
    setMessage("Não foi possível ler o código. Tenta enquadrar melhor.");
    setTimeout(() => { setStatus("scanning"); setMessage("Aponta para o código de barras e toca em Scan"); }, 2000);
  }, [lookup, stopCamera]);

  // ── File/gallery input decode ─────────────────────────────────────────────
  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("found");
    setMessage("A analisar imagem...");

    try {
      if (typeof BarcodeDetector !== "undefined") {
        const bitmap = await createImageBitmap(file);
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
        });
        const barcodes = await detector.detect(bitmap);
        if (barcodes.length > 0) {
          await lookup(barcodes[0].rawValue);
          return;
        }
      }
      setStatus("error");
      setMessage("Não foi possível ler o código na imagem.");
    } catch {
      setStatus("error");
      setMessage("Erro ao processar a imagem.");
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  }, [lookup]);

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (typeof BarcodeDetector !== "undefined") {
        try {
          const formats = await BarcodeDetector.getSupportedFormats();
          if (formats.includes("ean_13")) {
            setUseNative(true);
            await startNativeScanner();
            return;
          }
        } catch { /* not supported */ }
      }
      setUseNative(false);
      await startFallbackScanner();
    };
    init();
    return stopCamera;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top py-4 shrink-0">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Cancelar
        </button>
        <p className="text-white font-bold text-sm">Scan de código de barras</p>
        <div className="w-16" />
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        {status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dark vignette */}
            <div className="absolute inset-0" style={{
              background: "radial-gradient(ellipse 70% 35% at center, transparent 0%, rgba(0,0,0,0.75) 100%)"
            }} />

            {/* Scan frame */}
            <div className="relative w-72 h-40">
              {/* Animated scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 z-10"
                style={{
                  background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                  animation: "scanline 2s ease-in-out infinite",
                  top: "50%",
                }}
              />
              {/* Corner brackets */}
              {[
                "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-brand-gold ${cls}`} />
              ))}
            </div>
          </div>
        )}

        {/* Status overlay — error / found */}
        {(status === "found" || status === "error") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center space-y-3 px-8">
              <div className="text-5xl">{status === "found" ? "✅" : "❌"}</div>
              <p className="text-white font-semibold text-sm">{message}</p>
              {status === "error" && (
                <button
                  onClick={() => { setStatus("scanning"); setMessage(useNative ? "Aponta para o código de barras" : "Aponta para o código de barras e toca em Scan"); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-black"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          </div>
        )}

        {/* Starting overlay */}
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-300 text-sm">{message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-safe-bottom py-6 space-y-3">
        <p className="text-center text-zinc-400 text-xs">{status === "scanning" ? message : ""}</p>

        <div className="flex gap-3">
          {/* Manual capture (fallback) */}
          {!useNative && status === "scanning" && streamRef.current && (
            <button
              onClick={captureAndDecode}
              className="flex-1 py-4 rounded-2xl font-bold text-black text-sm"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              📸 Scan
            </button>
          )}

          {/* File / gallery input */}
          <label
            className={`${!useNative && status === "scanning" && streamRef.current ? "flex-shrink-0 w-14" : "flex-1"} flex items-center justify-center py-4 rounded-2xl border border-zinc-700 text-zinc-300 text-sm font-semibold cursor-pointer hover:bg-zinc-800 transition-colors`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInput}
            />
            {!useNative && status === "scanning" && streamRef.current ? "🖼" : "📷 Usar galeria / câmara"}
          </label>
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 15%; opacity: 0.6; }
          50% { top: 85%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
