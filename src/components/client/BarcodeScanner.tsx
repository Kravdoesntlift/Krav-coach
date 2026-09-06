"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { IScannerControls } from "@zxing/browser";
import { useLang } from "@/lib/i18n/useLang";

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

type ScanState = "requesting" | "scanning" | "loading" | "error" | "notfound";

export default function BarcodeScanner({ onFound, onClose }: Props) {
  const { t, lang } = useLang();

  const videoRef    = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const foundRef    = useRef(false); // prevent double-lookup

  const [state, setState]       = useState<ScanState>("requesting");
  const [message, setMessage]   = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);

  const extra = {
    accessing_camera:    { pt: "A aceder à câmara…",           en: "Accessing camera…" },
    searching_product:   { pt: "A procurar produto…",          en: "Searching product…" },
    product_not_found:   { pt: "Produto não encontrado na base de dados.", en: "Product not found in database." },
    network_error:       { pt: "Erro de rede. Verifica a ligação.", en: "Network error. Check your connection." },
    aim_at_barcode:      { pt: "Aponta para o código de barras", en: "Aim at the barcode" },
    camera_denied:       { pt: "Acesso à câmara negado. Permite nas definições do browser e tenta de novo.", en: "Camera access denied. Allow it in browser settings and try again." },
    camera_unavailable:  { pt: "Não foi possível aceder à câmara. Usa a opção de galeria em baixo.", en: "Could not access camera. Use the gallery option below." },
    analysing_image:     { pt: "A analisar imagem…",           en: "Analysing image…" },
    code_not_recognised: { pt: "Código não reconhecido na imagem. Tenta com melhor iluminação ou insere o número manualmente.", en: "Barcode not recognised in image. Try better lighting or enter the number manually." },
    image_error:         { pt: "Erro ao processar imagem.",     en: "Error processing image." },
    cancel:              { pt: "Cancelar",                      en: "Cancel" },
    barcode_title:       { pt: "Código de barras",              en: "Barcode" },
    centre_barcode:      { pt: "Centra o código de barras no rectângulo dourado", en: "Centre the barcode in the golden rectangle" },
    products_db:         { pt: "Open Food Facts · 3M+ produtos", en: "Open Food Facts · 3M+ products" },
    starting_camera:     { pt: "A iniciar câmara",              en: "Starting camera" },
    product_not_found_title: { pt: "Produto não encontrado",   en: "Product not found" },
    camera_unavailable_title: { pt: "Câmara indisponível",     en: "Camera unavailable" },
    ean_hint:            { pt: "Código EAN-13 (13 dígitos)",    en: "EAN-13 code (13 digits)" },
    search_product:      { pt: "Procurar produto",              en: "Search product" },
    back_to_scan:        { pt: "← Voltar ao scan",             en: "← Back to scan" },
    try_again:           { pt: "Tentar novamente",              en: "Try again" },
    use_gallery:         { pt: "Usar galeria / câmara",         en: "Use gallery / camera" },
    photo_barcode:       { pt: "Fotografar código de barras",   en: "Take a photo of the barcode" },
    enter_manually:      { pt: "Inserir código manualmente",    en: "Enter code manually" },
    insert_barcode:      { pt: "Inserir código de barras",      en: "Enter barcode" },
    ean_hint2:           { pt: "Código EAN-13 ou EAN-8 (sem espaços)", en: "EAN-13 or EAN-8 code (no spaces)" },
  } as const;

  // ── Stop scanner ────────────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    try { controlsRef.current?.stop(); } catch { /* ignore */ }
    controlsRef.current = null;
  }, []);

  // ── Lookup barcode via API ───────────────────────────────────────────────
  const lookup = useCallback(async (code: string) => {
    if (foundRef.current) return;
    foundRef.current = true;
    stopScanner();
    setState("loading");
    setMessage(extra.searching_product[lang]);
    try {
      const res  = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}&lang=${lang}`);
      const data = await res.json();
      if (!res.ok || !data.food) {
        setState("notfound");
        setMessage(data.error ?? extra.product_not_found[lang]);
        foundRef.current = false;
        return;
      }
      onFound(data.food);
    } catch {
      setState("error");
      setMessage(extra.network_error[lang]);
      foundRef.current = false;
    }
  }, [onFound, stopScanner, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start ZXing scanner ──────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    stopScanner();
    foundRef.current = false;
    setState("requesting");
    setMessage(extra.accessing_camera[lang]);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat, NotFoundException } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 200,
        delayBetweenScanSuccess: 500,
      });

      setState("scanning");
      setMessage(extra.aim_at_barcode[lang]);

      // decodeFromConstraints handles getUserMedia + video setup automatically
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current!,
        (result, err) => {
          if (result) {
            lookup(result.getText());
          } else if (err && !(err instanceof NotFoundException)) {
            // Ignore NotFoundException: just means no barcode in this frame
            console.warn("[BarcodeScanner]", err.message);
          }
        }
      );
      controlsRef.current = controls;

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (/permission|denied|not allowed/i.test(msg)) {
        setState("error");
        setMessage(extra.camera_denied[lang]);
      } else {
        setState("error");
        setMessage(extra.camera_unavailable[lang]);
      }
    }
  }, [lookup, stopScanner, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle file/photo input (fallback) ──────────────────────────────────
  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    stopScanner();
    foundRef.current = false;
    setState("loading");
    setMessage(extra.analysing_image[lang]);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      const url = URL.createObjectURL(file);
      try {
        const result = await reader.decodeFromImageUrl(url);
        URL.revokeObjectURL(url);
        await lookup(result.getText());
      } catch {
        URL.revokeObjectURL(url);
        setState("notfound");
        setMessage(extra.code_not_recognised[lang]);
        foundRef.current = false;
      }
    } catch {
      setState("error");
      setMessage(extra.image_error[lang]);
      foundRef.current = false;
    }
  }, [lookup, stopScanner, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manual code ──────────────────────────────────────────────────────────
  const submitManual = useCallback(async () => {
    const code = manualCode.trim().replace(/\s/g, "");
    if (code.length < 8) return;
    await lookup(code);
  }, [manualCode, lookup]);

  const retry = useCallback(() => {
    setManualCode("");
    setShowManual(false);
    startScanner();
  }, [startScanner]);

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    startScanner();
    return stopScanner;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isScanning = state === "scanning";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: "none" }}>

      {/* ── Top gradient bar ── */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-14 pb-6"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>
        <button
          onClick={() => { stopScanner(); onClose(); }}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {extra.cancel[lang]}
        </button>
        <p className="text-white font-bold text-sm tracking-wide">{extra.barcode_title[lang]}</p>
        <div className="w-16" />
      </div>

      {/* ── Camera ── */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Viewfinder: visible while scanning */}
        {isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Vignette */}
            <div className="absolute inset-0" style={{
              background: [
                "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%,  transparent 28%)",
                "linear-gradient(to top,    rgba(0,0,0,0.6) 0%,  transparent 28%)",
                "linear-gradient(to right,  rgba(0,0,0,0.55) 0%, transparent 18%)",
                "linear-gradient(to left,   rgba(0,0,0,0.55) 0%, transparent 18%)",
              ].join(", ")
            }} />

            {/* Scan frame */}
            <div className="relative" style={{ width: 290, height: 170 }}>
              {/* Corners */}
              {[
                "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[18px]",
                "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[18px]",
                "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[18px]",
                "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[18px]",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-9 h-9 ${cls}`} style={{ borderColor: "#C9A84C" }} />
              ))}

              {/* Scan line */}
              <div className="absolute inset-x-4" style={{ top: 8, bottom: 8, overflow: "hidden" }}>
                <div className="scanline absolute inset-x-0 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent, #E8C96B 30%, #C9A84C 50%, #E8C96B 70%, transparent)" }} />
              </div>
            </div>

            <p className="text-white/65 text-xs font-medium mt-6 tracking-wide text-center px-8">
              {extra.centre_barcode[lang]}
            </p>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-zinc-800" />
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#C9A84C", borderTopColor: "transparent" }} />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-bold text-sm">{message}</p>
              <p className="text-zinc-500 text-xs">{extra.products_db[lang]}</p>
            </div>
          </div>
        )}

        {/* Requesting */}
        {state === "requesting" && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-6 px-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.28)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white font-bold text-base">{extra.starting_camera[lang]}</p>
              <p className="text-zinc-500 text-sm leading-relaxed">{message}</p>
            </div>
            <div className="w-8 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-brand-gold rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Error / Not found */}
        {(state === "error" || state === "notfound") && (
          <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center gap-6 px-7">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: state === "notfound" ? "rgba(201,168,76,0.1)" : "rgba(248,113,113,0.08)",
                border: `1px solid ${state === "notfound" ? "rgba(201,168,76,0.28)" : "rgba(248,113,113,0.25)"}`,
              }}>
              {state === "notfound" ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              ) : (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9V6a1 1 0 0 1 1-1h3M3 15v3a1 1 0 0 0 1 1h3M15 5h3a1 1 0 0 1 1 1v3M15 19h3a1 1 0 0 0 1-1v-3"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              )}
            </div>

            <div className="text-center space-y-2 max-w-xs">
              <p className="text-white font-bold text-base">
                {state === "notfound" ? extra.product_not_found_title[lang] : extra.camera_unavailable_title[lang]}
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
            </div>

            {showManual ? (
              <div className="w-full space-y-3 max-w-xs">
                <div className="space-y-1.5">
                  <p className="text-zinc-500 text-xs text-center">{extra.ean_hint[lang]}</p>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Ex: 5601234567890"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
                    className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-center text-lg tracking-widest font-mono placeholder:text-zinc-700 focus:outline-none focus:border-brand-gold/50 transition-colors"
                  />
                </div>
                <button
                  onClick={submitManual}
                  disabled={manualCode.trim().length < 8}
                  className="w-full py-3.5 rounded-2xl font-bold text-black text-sm disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                >
                  {extra.search_product[lang]}
                </button>
                {state !== "error" && (
                  <button onClick={retry} className="w-full py-2.5 text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors">
                    {extra.back_to_scan[lang]}
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full space-y-2.5 max-w-xs">
                {state !== "error" && (
                  <button
                    onClick={retry}
                    className="w-full py-3.5 rounded-2xl font-bold text-black text-sm"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    {extra.try_again[lang]}
                  </button>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-zinc-700 text-zinc-200 text-sm font-semibold cursor-pointer hover:bg-zinc-800/60 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {extra.photo_barcode[lang]}
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                </label>
                <button onClick={() => setShowManual(true)} className="w-full py-2.5 text-zinc-600 text-xs font-medium hover:text-zinc-400 transition-colors">
                  {extra.enter_manually[lang]}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar (scanning) ── */}
      {isScanning && (
        <div className="shrink-0 px-5 pb-12 pt-4 space-y-3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 100%)" }}>

          <label className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-zinc-200 text-sm font-semibold">{extra.use_gallery[lang]}</span>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </label>

          <button onClick={() => setShowManual(true)}
            className="w-full text-center text-zinc-600 text-xs py-1 hover:text-zinc-400 transition-colors">
            {extra.enter_manually[lang]}
          </button>
        </div>
      )}

      {/* Manual input: bottom sheet when scanning */}
      {isScanning && showManual && (
        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-10 pt-6 space-y-3 rounded-t-3xl"
          style={{ background: "rgba(15,15,17,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>
          <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
          <p className="text-white font-bold text-sm mb-3">{extra.insert_barcode[lang]}</p>
          <div className="space-y-1.5">
            <p className="text-zinc-500 text-xs">{extra.ean_hint2[lang]}</p>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              placeholder="Ex: 5601234567890"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 14))}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-center text-lg tracking-widest font-mono placeholder:text-zinc-700 focus:outline-none focus:border-brand-gold/50 transition-colors"
            />
          </div>
          <button
            onClick={submitManual}
            disabled={manualCode.trim().length < 8}
            className="w-full py-3.5 rounded-2xl font-bold text-black text-sm disabled:opacity-40 transition-all"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            {extra.search_product[lang]}
          </button>
          <button onClick={() => setShowManual(false)} className="w-full py-2 text-zinc-600 text-sm text-center hover:text-zinc-400 transition-colors">
            {extra.cancel[lang]}
          </button>
        </div>
      )}

      <style>{`
        .scanline {
          animation: scanline 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes scanline {
          0%   { top: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
