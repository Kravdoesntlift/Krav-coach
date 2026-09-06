"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import AvatarUpload from "@/components/AvatarUpload";
import { useLang } from "@/lib/i18n/useLang";

const extra = {
  role_coach:       { pt: "Coach",          en: "Coach" },
  role_client:      { pt: "Cliente",        en: "Client" },
  name_label:       { pt: "Nome",           en: "Name" },
  saving:           { pt: "A guardar...",   en: "Saving..." },
  saved:            { pt: "Guardado!",      en: "Saved!" },
  save_error:       { pt: "Erro ao guardar.", en: "Error saving." },
  change_password:  { pt: "Alterar Password", en: "Change Password" },
  new_password:     { pt: "Nova password",  en: "New password" },
  new_pwd_ph:       { pt: "Mínimo 6 caracteres", en: "Minimum 6 characters" },
  confirm_pwd:      { pt: "Confirmar password", en: "Confirm password" },
  confirm_pwd_ph:   { pt: "Repete a nova password", en: "Repeat new password" },
  changing:         { pt: "A alterar...",   en: "Changing..." },
  change_btn:       { pt: "Alterar password", en: "Change password" },
  pwd_short:        { pt: "A password deve ter pelo menos 6 caracteres.", en: "Password must be at least 6 characters." },
  pwd_mismatch:     { pt: "As passwords não coincidem.", en: "Passwords do not match." },
  pwd_ok:           { pt: "Password alterada com sucesso!", en: "Password changed successfully!" },
  pwd_error:        { pt: "Erro ao alterar password.", en: "Error changing password." },
  tagline_pt:       { pt: "Tagline", en: "Tagline" },
  tagline_pt_hint:  { pt: "🇵🇹 Frase curta de impacto", en: "🇵🇹 Short impact phrase" },
  tagline_en_label: { pt: "Tagline em inglês", en: "Tagline in English" },
  about_section:    { pt: "Sobre ti, landing page", en: "About you, landing page" },
  years_exp:        { pt: "Anos de experiência", en: "Years of experience" },
  years_hint:       { pt: "Aparece como badge na landing", en: "Appears as badge on landing page" },
  bio_pt:           { pt: "Bio 🇵🇹", en: "Bio 🇵🇹" },
  bio_pt_hint:      { pt: "2–3 frases sobre a tua formação e abordagem", en: "2–3 sentences about your training and approach" },
  bio_en_label:     { pt: "Bio 🇬🇧", en: "Bio 🇬🇧" },
  bio_en_hint:      { pt: "Versão em inglês", en: "English version" },
  credentials:      { pt: "Credenciais / Diplomas", en: "Credentials / Certifications" },
  credentials_hint: { pt: "Uma por linha, aparecem como badges", en: "One per line, shown as badges" },
  credentials_note: { pt: "Cada linha = 1 badge na landing page", en: "Each line = 1 badge on landing page" },
  slug_label:       { pt: "URL público (slug)", en: "Public URL (slug)" },
  slug_hint:        { pt: "Letras minúsculas, números e hífens, ex: andre-kravchuk", en: "Lowercase letters, numbers and hyphens, e.g. andre-kravchuk" },
} as const;

interface Props {
  profile: Profile & {
    avatar_url?: string | null;
    tagline?: string | null;
    tagline_en?: string | null;
    bio?: string | null;
    bio_en?: string | null;
    years_experience?: number | null;
    credentials?: string[] | null;
    slug?: string | null;
  };
  email: string;
}

export default function ProfileForm({ profile, email }: Props) {
  const { lang, t } = useLang();
  const [fullName, setFullName] = useState(profile.full_name);
  const [slug, setSlug] = useState(profile.slug ?? "");
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [taglineEn, setTaglineEn] = useState(profile.tagline_en ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioEn, setBioEn] = useState(profile.bio_en ?? "");
  const [yearsExp, setYearsExp] = useState(String(profile.years_experience ?? ""));
  const [credentials, setCredentials] = useState((profile.credentials ?? []).join("\n"));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSavingName(true);
    setNameMsg(null);
    const supabase = createClient();
    const updates: Record<string, unknown> = { full_name: fullName.trim() };
    if (profile.role === "coach") {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (cleanSlug) updates.slug = cleanSlug;
      updates.tagline = tagline.trim();
      updates.tagline_en = taglineEn.trim();
      updates.bio = bio.trim();
      updates.bio_en = bioEn.trim();
      updates.years_experience = yearsExp ? parseInt(yearsExp, 10) : null;
      updates.credentials = credentials
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    setNameMsg(error
      ? { type: "err", text: extra.save_error[lang] }
      : { type: "ok", text: extra.saved[lang] });
    setSavingName(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwdMsg({ type: "err", text: extra.pwd_short[lang] });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "err", text: extra.pwd_mismatch[lang] });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwdMsg({ type: "err", text: extra.pwd_error[lang] });
    } else {
      setPwdMsg({ type: "ok", text: extra.pwd_ok[lang] });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPwd(false);
  }

  return (
    <div className="space-y-6">
      {/* Avatar + info */}
      <div className="card p-5 space-y-5">
        <AvatarUpload
          userId={profile.id}
          currentUrl={profile.avatar_url ?? null}
          fullName={profile.full_name}
        />

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
            {profile.role === "coach" ? extra.role_coach[lang] : extra.role_client[lang]}
          </span>
          <span className="text-gray-600 text-xs">{email}</span>
        </div>

        {/* Change name */}
        <form onSubmit={handleNameSubmit} className="space-y-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="label">{extra.name_label[lang]}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" required />
          </div>

          {/* Coach-only fields */}
          {profile.role === "coach" && (
            <>
              <div>
                <label className="label">
                  {extra.slug_label[lang]} <span className="text-gray-600 text-[11px]">{extra.slug_hint[lang]}</span>
                </label>
                <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-zinc-700 focus-within:border-brand-gold/50 transition-colors">
                  <span className="bg-zinc-800 text-zinc-500 text-xs px-3 py-2.5 border-r border-zinc-700 whitespace-nowrap shrink-0">
                    kravcoaching.com/p/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="bg-zinc-900 text-white text-sm px-3 py-2.5 flex-1 outline-none placeholder-zinc-600"
                    placeholder="andre-kravchuk"
                    maxLength={40}
                  />
                </div>
                <p className="text-zinc-600 text-[11px] mt-1">
                  Depois de guardar, podes partilhar este link limpo nos anúncios
                </p>
              </div>

              <div>
                <label className="label">
                  {extra.tagline_pt[lang]} <span className="text-gray-600 text-[11px]">{extra.tagline_pt_hint[lang]}</span>
                </label>
                <input
                  type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  className="input" placeholder="ex: Transforma o teu corpo em 12 semanas"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="label">
                  {extra.tagline_en_label[lang]} <span className="text-gray-600 text-[11px]">🇬🇧</span>
                </label>
                <input
                  type="text" value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)}
                  className="input" placeholder="ex: Transform your body in 12 weeks"
                  maxLength={80}
                />
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{extra.about_section[lang]}</p>
                <div>
                  <label className="label">
                    {extra.years_exp[lang]} <span className="text-gray-600 text-[11px]">{extra.years_hint[lang]}</span>
                  </label>
                  <input
                    type="number" min="0" max="50"
                    value={yearsExp} onChange={(e) => setYearsExp(e.target.value)}
                    className="input" placeholder="ex: 5"
                  />
                </div>
                <div>
                  <label className="label">
                    {extra.bio_pt[lang]} <span className="text-gray-600 text-[11px]">{extra.bio_pt_hint[lang]}</span>
                  </label>
                  <textarea
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    className="input resize-none" rows={4}
                    maxLength={600}
                    placeholder="ex: Licenciado em Ciências do Desporto pela FMH. Especializado em treino de força e composição corporal."
                  />
                </div>
                <div>
                  <label className="label">
                    {extra.bio_en_label[lang]} <span className="text-gray-600 text-[11px]">{extra.bio_en_hint[lang]}</span>
                  </label>
                  <textarea
                    value={bioEn} onChange={(e) => setBioEn(e.target.value)}
                    className="input resize-none" rows={4}
                    maxLength={600}
                    placeholder="ex: BSc in Sports Science. Specialised in strength training and body recomposition."
                  />
                </div>
                <div>
                  <label className="label">
                    {extra.credentials[lang]} <span className="text-gray-600 text-[11px]">{extra.credentials_hint[lang]}</span>
                  </label>
                  <textarea
                    value={credentials} onChange={(e) => setCredentials(e.target.value)}
                    className="input resize-none" rows={4}
                    placeholder={"Licenciado em Ciências do Desporto\nCertificado NSCA-CPT\n5 anos de experiência clínica"}
                  />
                  <p className="text-zinc-600 text-[11px] mt-1">{extra.credentials_note[lang]}</p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingName} className="btn-primary text-sm py-2">
              {savingName ? extra.saving[lang] : t("save_changes")}
            </button>
            {nameMsg && (
              <span className={`text-xs ${nameMsg.type === "ok" ? "text-green-400" : "text-brand-gold"}`}>
                {nameMsg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h2 className="text-white font-semibold mb-4">{extra.change_password[lang]}</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="label">{extra.new_password[lang]}</label>
            <input
              type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="input" placeholder={extra.new_pwd_ph[lang]} autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">{extra.confirm_pwd[lang]}</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="input" placeholder={extra.confirm_pwd_ph[lang]} autoComplete="new-password"
            />
          </div>
          {pwdMsg && (
            <p className={`text-sm px-4 py-3 rounded-lg border ${
              pwdMsg.type === "ok"
                ? "text-green-400 bg-green-950/20 border-green-900/30"
                : "text-brand-gold bg-yellow-950/20 border-brand-gold/30"
            }`}>
              {pwdMsg.text}
            </p>
          )}
          <button type="submit" disabled={savingPwd} className="btn-primary text-sm py-2">
            {savingPwd ? extra.changing[lang] : extra.change_btn[lang]}
          </button>
        </form>
      </div>
    </div>
  );
}
