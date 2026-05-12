"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import AvatarUpload from "@/components/AvatarUpload";

interface Props {
  profile: Profile & { avatar_url?: string | null; tagline?: string | null };
  email: string;
}

export default function ProfileForm({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [tagline, setTagline] = useState(profile.tagline ?? "");
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
    const updates: Record<string, string> = { full_name: fullName.trim() };
    if (profile.role === "coach") updates.tagline = tagline.trim();
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

          {/* Coach tagline */}
          {profile.role === "coach" && (
            <div>
              <label className="label">
                Tagline <span className="text-gray-600">(aparece aos clientes no onboarding)</span>
              </label>
              <input
                type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                className="input" placeholder="ex: Transforma o teu corpo em 12 semanas"
                maxLength={80}
              />
            </div>
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
