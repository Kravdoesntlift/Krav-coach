"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import AvatarUpload from "@/components/AvatarUpload";

interface Props {
  profile: Profile & {
    avatar_url?: string | null;
    tagline?: string | null;
    tagline_en?: string | null;
    bio?: string | null;
    bio_en?: string | null;
    years_experience?: number | null;
    credentials?: string[] | null;
  };
  email: string;
}

export default function ProfileForm({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile.full_name);
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
    setNameMsg(error ? { type: "err", text: "Erro ao guardar." } : { type: "ok", text: "Guardado!" });
    setSavingName(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwdMsg({ type: "err", text: "A password deve ter pelo menos 6 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "err", text: "As passwords não coincidem." });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwdMsg({ type: "err", text: "Erro ao alterar password." });
    } else {
      setPwdMsg({ type: "ok", text: "Password alterada com sucesso!" });
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
            {profile.role === "coach" ? "Coach" : "Cliente"}
          </span>
          <span className="text-gray-600 text-xs">{email}</span>
        </div>

        {/* Change name */}
        <form onSubmit={handleNameSubmit} className="space-y-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="label">Nome</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" required />
          </div>

          {/* Coach-only fields */}
          {profile.role === "coach" && (
            <>
              <div>
                <label className="label">
                  Tagline <span className="text-gray-600 text-[11px]">🇵🇹 Frase curta de impacto</span>
                </label>
                <input
                  type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  className="input" placeholder="ex: Transforma o teu corpo em 12 semanas"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="label">
                  Tagline em inglês <span className="text-gray-600 text-[11px]">🇬🇧</span>
                </label>
                <input
                  type="text" value={taglineEn} onChange={(e) => setTaglineEn(e.target.value)}
                  className="input" placeholder="ex: Transform your body in 12 weeks"
                  maxLength={80}
                />
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Sobre ti — landing page</p>
                <div>
                  <label className="label">
                    Anos de experiência <span className="text-gray-600 text-[11px]">Aparece como badge na landing</span>
                  </label>
                  <input
                    type="number" min="0" max="50"
                    value={yearsExp} onChange={(e) => setYearsExp(e.target.value)}
                    className="input" placeholder="ex: 5"
                  />
                </div>
                <div>
                  <label className="label">
                    Bio 🇵🇹 <span className="text-gray-600 text-[11px]">2–3 frases sobre a tua formação e abordagem</span>
                  </label>
                  <textarea
                    value={bio} onChange={(e) => setBio(e.target.value)}
                    className="input resize-none" rows={4}
                    maxLength={600}
                    placeholder="ex: Licenciado em Ciências do Desporto pela FMH. Especializado em treino de força e composição corporal. Já acompanhei mais de 100 clientes a transformar o seu corpo."
                  />
                </div>
                <div>
                  <label className="label">
                    Bio 🇬🇧 <span className="text-gray-600 text-[11px]">Versão em inglês</span>
                  </label>
                  <textarea
                    value={bioEn} onChange={(e) => setBioEn(e.target.value)}
                    className="input resize-none" rows={4}
                    maxLength={600}
                    placeholder="ex: BSc in Sports Science. Specialised in strength training and body recomposition. Coached 100+ clients."
                  />
                </div>
                <div>
                  <label className="label">
                    Credenciais / Diplomas <span className="text-gray-600 text-[11px]">Uma por linha — aparecem como badges</span>
                  </label>
                  <textarea
                    value={credentials} onChange={(e) => setCredentials(e.target.value)}
                    className="input resize-none" rows={4}
                    placeholder={"Licenciado em Ciências do Desporto\nCertificado NSCA-CPT\n5 anos de experiência clínica\nEspecialista em perda de gordura"}
                  />
                  <p className="text-zinc-600 text-[11px] mt-1">Cada linha = 1 badge na landing page</p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingName} className="btn-primary text-sm py-2">
              {savingName ? "A guardar..." : "Guardar"}
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
        <h2 className="text-white font-semibold mb-4">Alterar Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="label">Nova password</label>
            <input
              type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="input" placeholder="Mínimo 6 caracteres" autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirmar password</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="input" placeholder="Repete a nova password" autoComplete="new-password"
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
            {savingPwd ? "A alterar..." : "Alterar password"}
          </button>
        </form>
      </div>
    </div>
  );
}
