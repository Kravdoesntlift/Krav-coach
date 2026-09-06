"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/useLang";

const copy = {
  title:       { pt: "Autenticação em 2 Passos",                              en: "Two-Factor Authentication" },
  subtitle:    { pt: "Protege a tua conta com TOTP",                          en: "Protect your account with TOTP" },
  active_badge:{ pt: "Ativo ✓",                                               en: "Active ✓" },
  enable:      { pt: "Ativar 2FA",                                            en: "Enable 2FA" },
  disable:     { pt: "Desativar 2FA",                                         en: "Disable 2FA" },
  confirm_disable: { pt: "Confirmar desativação",                             en: "Confirm disable" },
  cancel:      { pt: "Cancelar",                                              en: "Cancel" },
  scan_hint:   { pt: "Escaneia o QR code com Google Authenticator ou Authy",  en: "Scan the QR code with Google Authenticator or Authy" },
  manual_hint: { pt: "Ou introduz o segredo manualmente:",                    en: "Or enter the secret manually:" },
  otp_label:   { pt: "Introduz o código da app autenticadora",                en: "Enter the code from your authenticator app" },
  verify:      { pt: "Verificar",                                             en: "Verify" },
  loading:     { pt: "A carregar…",                                           en: "Loading…" },
  error_enroll:{ pt: "Erro ao iniciar configuração. Tenta novamente.",        en: "Error starting setup. Please try again." },
  error_verify:{ pt: "Código inválido. Verifica a app autenticadora.",        en: "Invalid code. Check your authenticator app." },
  error_disable:{ pt: "Erro ao desativar. Tenta novamente.",                  en: "Error disabling 2FA. Please try again." },
  success_verify:{ pt: "2FA ativado com sucesso!",                            en: "2FA enabled successfully!" },
  success_disable:{ pt: "2FA desativado.",                                    en: "2FA disabled." },
} as const;

type Stage = "idle" | "enrolling" | "verifying" | "active" | "confirming-disable";

interface EnrollData {
  factorId: string;
  qrUri: string;
  secret: string;
  challengeId: string;
}

export default function TwoFactorSettings() {
  const { lang } = useLang();
  const c = (key: keyof typeof copy) => copy[key][lang];

  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("idle");
  const [loading, setLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // On mount, check existing factors
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        const verified = data.totp.find((f) => f.factor_type === "totp" && f.status === "verified");
        if (verified) {
          setActiveFactorId(verified.id);
          setStage("active");
        } else {
          setStage("idle");
        }
      }
      setLoading(false);
    })();
  }, []);

  async function handleEnable() {
    setError(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) throw error;

      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeErr || !challengeData) throw challengeErr;

      setEnrollData({
        factorId: data.id,
        qrUri: data.totp.uri,
        secret: data.totp.secret,
        challengeId: challengeData.id,
      });
      setStage("verifying");
    } catch {
      setError(c("error_enroll"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!enrollData) return;
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId: enrollData.challengeId,
        code: otpCode.trim(),
      });
      if (error) throw error;
      setActiveFactorId(enrollData.factorId);
      setEnrollData(null);
      setOtpCode("");
      setStage("active");
      setSuccessMsg(c("success_verify"));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError(c("error_verify"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!activeFactorId) return;
    setError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactorId });
      if (error) throw error;
      setActiveFactorId(null);
      setStage("idle");
      setSuccessMsg(c("success_disable"));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError(c("error_disable"));
    } finally {
      setBusy(false);
    }
  }

  const qrUrl = enrollData
    ? `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(enrollData.qrUri)}`
    : null;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
          🔐
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm">{c("title")}</p>
          <p className="text-zinc-500 text-xs">{c("subtitle")}</p>
        </div>
        {stage === "active" && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
            {c("active_badge")}
          </span>
        )}
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <p className="text-green-400 text-xs font-medium">{successMsg}</p>
      )}
      {error && (
        <p className="text-red-400 text-xs font-medium">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-zinc-500 text-xs">{c("loading")}</p>
      )}

      {/* IDLE: show Enable button */}
      {!loading && stage === "idle" && (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#A8893A] text-black text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? c("loading") : c("enable")}
        </button>
      )}

      {/* VERIFYING: show QR + code input */}
      {!loading && stage === "verifying" && enrollData && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-xs">{c("scan_hint")}</p>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl!}
                alt="QR Code 2FA"
                width={200}
                height={200}
                className="block"
              />
            </div>
          </div>

          {/* Secret */}
          <div>
            <p className="text-zinc-500 text-xs mb-1">{c("manual_hint")}</p>
            <code className="block text-xs text-zinc-300 bg-zinc-800 rounded-lg px-3 py-2 break-all font-mono">
              {enrollData.secret}
            </code>
          </div>

          {/* OTP input */}
          <div className="space-y-2">
            <label className="block text-zinc-400 text-xs">{c("otp_label")}</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="000000"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-center text-xl font-mono tracking-widest focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={otpCode.length !== 6 || busy}
              className="w-full py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#A8893A] text-black text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {busy ? c("loading") : c("verify")}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE: show Disable button (2-step) */}
      {!loading && (stage === "active" || stage === "confirming-disable") && (
        <>
          {stage === "active" && (
            <button
              onClick={() => { setError(null); setStage("confirming-disable"); }}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/30 text-sm font-semibold transition-all"
            >
              {c("disable")}
            </button>
          )}
          {stage === "confirming-disable" && (
            <div className="space-y-2">
              <p className="text-red-400 text-xs font-medium text-center">{c("disable")}?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setStage("active")}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold transition-all"
                >
                  {c("cancel")}
                </button>
                <button
                  onClick={handleDisable}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {busy ? c("loading") : c("confirm_disable")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
