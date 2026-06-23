"use client";

import { useEffect, useState } from "react";
import type { ReferralCode, Referral } from "@/lib/supabase/types";
import { useLang } from "@/lib/i18n/useLang";

const extra = {
  status_labels: {
    pt: {
      pending:   { label: "Pendente",    color: "text-zinc-500" },
      signed_up: { label: "Registado",   color: "text-blue-400" },
      active:    { label: "Activo 🎉",   color: "text-green-400" },
    },
    en: {
      pending:   { label: "Pending",     color: "text-zinc-500" },
      signed_up: { label: "Signed up",   color: "text-blue-400" },
      active:    { label: "Active 🎉",   color: "text-green-400" },
    },
  },
  title:          { pt: "Referências", en: "Referrals" },
  sub:            { pt: "Convida amigos e acompanha as tuas referências", en: "Invite friends and track your referrals" },
  invited:        { pt: "Convidados", en: "Invited" },
  active:         { pt: "Activos", en: "Active" },
  invite_link:    { pt: "O teu link de convite", en: "Your invite link" },
  invite_link_sub:{ pt: "Partilha com amigos que querem transformar-se", en: "Share with friends who want to transform" },
  copied:         { pt: "✓ Copiado!", en: "✓ Copied!" },
  copy_link:      { pt: "Copiar link", en: "Copy link" },
  share:          { pt: "Partilhar", en: "Share" },
  share_text:     { pt: "Junta-te ao KRAV Coaching e transforma o teu corpo! Usa o meu link:", en: "Join KRAV Coaching and transform your body! Use my link:" },
  how_works:      { pt: "Como funciona", en: "How it works" },
  steps: {
    pt: [
      "Partilhas o teu link com um amigo que queira transformar o corpo",
      "O amigo entra, paga e começa o programa de coaching",
      "Tu ganhas 1 mês grátis assim que ele ficar activo — o coach aplica automaticamente",
    ],
    en: [
      "Share your link with a friend who wants to transform their body",
      "Your friend joins, pays, and starts the coaching programme",
      "You get 1 free month once they go active — the coach applies it automatically",
    ],
  },
  tip: {
    pt: "O amigo convidado não recebe desconto automático — o incentivo dele é acesso a um coaching premium. Para ele também ganhar um mês grátis, basta convidar alguém.",
    en: "The invited friend doesn't get an automatic discount — their incentive is access to premium coaching. For them to also earn a free month, they just need to invite someone.",
  },
  your_refs:      { pt: "As tuas referências", en: "Your referrals" },
  anonymous:      { pt: "Anónimo", en: "Anonymous" },
  no_refs_title:  { pt: "Ainda sem referências", en: "No referrals yet" },
  no_refs_sub:    { pt: "Partilha o link e começa a convencer os teus amigos!", en: "Share your link and start convincing your friends!" },
  locale:         { pt: "pt-PT", en: "en-US" },
} as const;

export default function ReferralPage() {
  const { lang } = useLang();
  const [code, setCode]         = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  const STATUS_LABELS = extra.status_labels[lang];

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

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "KRAV Coaching",
        text: extra.share_text[lang],
        url: referralUrl,
      });
    } else {
      await copyLink();
    }
  }

  const activeCount  = referrals.filter((r) => r.status === "active").length;
  const totalCount   = referrals.length;
  const locale = extra.locale[lang];
  const steps = extra.steps[lang];

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">{extra.title[lang]}</h1>
        <p className="text-gray-400 text-sm mt-1">{extra.sub[lang]}</p>
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
              <p className="text-zinc-500 text-xs">{extra.invited[lang]}</p>
            </div>
            <div className="card p-4 text-center space-y-1">
              <p className="text-3xl font-black" style={{ color: "#C9A84C" }}>{activeCount}</p>
              <p className="text-zinc-500 text-xs">{extra.active[lang]}</p>
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
                <p className="text-white text-sm font-semibold">{extra.invite_link[lang]}</p>
                <p className="text-zinc-500 text-xs">{extra.invite_link_sub[lang]}</p>
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
                {copied ? extra.copied[lang] : extra.copy_link[lang]}
              </button>
              <button
                onClick={shareLink}
                className="flex-1 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-bold transition-colors"
              >
                {extra.share[lang]}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5 space-y-4">
            <p className="text-white text-sm font-semibold">{extra.how_works[lang]}</p>
            <div className="space-y-3">
              {steps.map((text, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black text-black mt-0.5"
                    style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
                  >
                    {idx + 1}
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
                {extra.tip[lang]}
              </p>
            </div>
          </div>

          {/* Referrals list */}
          {referrals.length > 0 && (
            <div className="card p-5 space-y-3">
              <p className="text-white text-sm font-semibold">{extra.your_refs[lang]}</p>
              <div className="space-y-2">
                {referrals.map((r) => {
                  const s = STATUS_LABELS[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2.5 border-b border-zinc-800/60 last:border-0"
                    >
                      <div>
                        <p className="text-white text-sm">{r.referred_email ?? extra.anonymous[lang]}</p>
                        <p className="text-zinc-600 text-xs">
                          {new Date(r.created_at).toLocaleDateString(locale)}
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
                <p className="text-white font-bold text-sm">{extra.no_refs_title[lang]}</p>
                <p className="text-zinc-500 text-xs mt-1">
                  {extra.no_refs_sub[lang]}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
