"use client";

import { useEffect, useState } from "react";
import type { ReferralCode, Referral } from "@/lib/supabase/types";

const STATUS_LABELS: Record<Referral["status"], { label: string; color: string }> = {
  pending:   { label: "Pendente",    color: "text-zinc-500" },
  signed_up: { label: "Registado",   color: "text-blue-400" },
  active:    { label: "Activo 🎉",   color: "text-green-400" },
};

export default function ReferralPage() {
  const [code, setCode]         = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => { setCode(d.code); setReferrals(d.referrals ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralUrl = code ? `${origin}/auth/signup?ref=${code.code}` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: "KRAV Coaching",
        text: "Junta-te ao KRAV Coaching e transforma o teu corpo! Usa o meu link:",
        url: referralUrl,
      });
    } else {
      await copyLink();
    }
  }

  const activeCount  = referrals.filter((r) => r.status === "active").length;
  const totalCount   = referrals.length;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">Referências</h1>
        <p className="text-gray-400 text-sm mt-1">Convida amigos e acompanha as tuas referências</p>
      </div>

      {loading ? (
        <div className="card p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center space-y-1">
              <p className="text-3xl font-black text-white">{totalCount}</p>
              <p className="text-zinc-500 text-xs">Convidados</p>
            </div>
            <div className="card p-4 text-center space-y-1">
              <p className="text-3xl font-black" style={{ color: "#C9A84C" }}>{activeCount}</p>
              <p className="text-zinc-500 text-xs">Activos</p>
            </div>
          </div>

          {/* Referral link card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                🔗
              </div>
              <div>
                <p className="text-white text-sm font-semibold">O teu link de convite</p>
                <p className="text-zinc-500 text-xs">Partilha com amigos que querem transformar-se</p>
              </div>
            </div>

            {/* Code display */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <code className="flex-1 text-brand-gold text-sm font-mono truncate">{referralUrl}</code>
              <span
                className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg"
                style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
              >
                {code?.code}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
                style={
                  copied
                    ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }
                    : { background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }
                }
              >
                {copied ? "✓ Copiado!" : "Copiar link"}
              </button>
              <button
                onClick={share}
                className="flex-1 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors"
              >
                Partilhar
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5 space-y-4">
            <p className="text-white text-sm font-semibold">Como funciona</p>
            <div className="space-y-3">
              {[
                { step: "1", text: "Partilhas o teu link com um amigo que queira transformar o corpo" },
                { step: "2", text: "O amigo entra, paga e começa o programa de coaching" },
                { step: "3", text: "Tu ganhas 1 mês grátis assim que ele ficar activo — o coach aplica automaticamente" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-black mt-0.5"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    {step}
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}
            >
              <span className="text-brand-gold text-base shrink-0">💡</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                O amigo convidado não recebe desconto automático — o incentivo dele é acesso a um coaching premium. Para ele também ganhar um mês grátis, basta convidar alguém.
              </p>
            </div>
          </div>

          {/* Referrals list */}
          {referrals.length > 0 && (
            <div className="card p-5 space-y-3">
              <p className="text-white text-sm font-semibold">As tuas referências</p>
              <div className="space-y-2">
                {referrals.map((r) => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0"
                    >
                      <div>
                        <p className="text-white text-sm">{r.referred_email ?? "Anónimo"}</p>
                        <p className="text-zinc-600 text-xs">
                          {new Date(r.created_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {referrals.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center space-y-3"
              style={{ background: "linear-gradient(160deg,#141414,#0d0d0d)" }}
            >
              <p className="text-4xl">👥</p>
              <div>
                <p className="text-white font-bold text-sm">Ainda sem referências</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Partilha o link e começa a convencer os teus amigos!
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
