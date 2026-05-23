"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Integration {
  provider: string;
  is_active: boolean;
  last_synced_at: string | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

function ProviderCard({
  icon,
  name,
  description,
  connected,
  lastSynced,
  onConnect,
  onSync,
  onDisconnect,
  syncing,
  comingSoon,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  lastSynced?: string | null;
  onConnect?: () => void;
  onSync?: () => void;
  onDisconnect?: () => void;
  syncing?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div className={`card p-4 flex items-start gap-4 ${comingSoon ? "opacity-50" : ""}`}>
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-2xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold">{name}</p>
          {comingSoon && (
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">Em breve</span>
          )}
          {connected && !comingSoon && (
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold">Ligado</span>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{description}</p>
        {connected && lastSynced && (
          <p className="text-gray-600 text-[11px] mt-1">
            Última sincronização: {new Date(lastSynced).toLocaleDateString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
      {!comingSoon && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          {connected ? (
            <>
              {onSync && (
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors disabled:opacity-40"
                >
                  {syncing ? "…" : "Sincronizar"}
                </button>
              )}
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-gray-500 hover:text-red-400 transition-colors"
                >
                  Desligar
                </button>
              )}
            </>
          ) : (
            onConnect && (
              <button
                onClick={onConnect}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700 transition-colors whitespace-nowrap"
              >
                Ligar
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function AppleShortcutSection({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  const webhookUrl = `${SITE_URL}/api/health/sync`;

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
          🍎
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold">Apple Health</p>
            <span className="text-[10px] bg-brand-gold/15 text-brand-gold px-2 py-0.5 rounded-full font-semibold">Via Atalhos</span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">Apple Watch, iPhone. Sincroniza passos e dados de saúde automaticamente todos os dias.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-brand-gold" : "bg-zinc-800"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-semibold">Passo 1 — Copia o teu token único</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Este token identifica-te de forma segura. Não o partilhes com ninguém.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 font-mono text-xs text-gray-300 truncate">
              {token}
            </div>
            <button
              onClick={copyToken}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                copied ? "bg-green-500/20 text-green-400" : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20"
              }`}
            >
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <button onClick={() => setStep(2)} className="w-full btn-primary py-2.5 text-sm">
            Próximo →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-semibold">Passo 2 — Cria o Atalho no iPhone</p>
          <ol className="space-y-2 text-xs text-gray-400 leading-relaxed">
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">1.</span>Abre a app <strong className="text-white">Atalhos</strong> no iPhone</li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">2.</span>Toca em <strong className="text-white">+</strong> para criar um novo Atalho</li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">3.</span>Adiciona a ação <strong className="text-white">"Saúde — Ler Dados de Saúde"</strong> → escolhe <strong className="text-white">Passos</strong>, período <strong className="text-white">Hoje</strong></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">4.</span>Adiciona <strong className="text-white">"URL"</strong> e cola: <code className="text-brand-gold bg-zinc-900 px-1 rounded">{webhookUrl}</code></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">5.</span>Adiciona <strong className="text-white">"Conteúdos de URL"</strong> → Método: <strong className="text-white">POST</strong>, Tipo: <strong className="text-white">JSON</strong></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">6.</span>No corpo JSON adiciona: <code className="text-brand-gold bg-zinc-900 px-1 rounded break-all">{`{"token":"SEU_TOKEN","steps":"Dados de Saúde"}`}</code></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">7.</span>Substitui <strong className="text-white">SEU_TOKEN</strong> pelo token que copiaste</li>
          </ol>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-zinc-800 hover:bg-zinc-700 transition-colors">
              ← Voltar
            </button>
            <button onClick={() => setStep(3)} className="flex-1 btn-primary py-2.5 text-sm">
              Próximo →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-semibold">Passo 3 — Automatiza a sincronização</p>
          <ol className="space-y-2 text-xs text-gray-400 leading-relaxed">
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">1.</span>Na app <strong className="text-white">Atalhos</strong>, vai ao separador <strong className="text-white">Automação</strong></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">2.</span>Toca em <strong className="text-white">+</strong> → <strong className="text-white">Criar Automação Pessoal</strong></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">3.</span>Escolhe <strong className="text-white">Hora do Dia</strong> → define <strong className="text-white">23:30</strong></li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">4.</span>Adiciona a ação <strong className="text-white">"Executar Atalho"</strong> → seleciona o atalho que criaste</li>
            <li className="flex gap-2"><span className="text-brand-gold font-bold flex-shrink-0">5.</span>Desativa <strong className="text-white">"Perguntar antes de executar"</strong> → Toca em <strong className="text-white">Concluído</strong></li>
          </ol>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400">
            ✓ A partir de agora, os teus passos do Apple Health serão enviados automaticamente todos os dias às 23:30!
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-zinc-800 hover:bg-zinc-700 transition-colors">
              ← Voltar
            </button>
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors font-semibold">
              ✓ Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApple, setShowApple] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const connected = searchParams.get("connected");
  const oauthError = searchParams.get("error");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [tokenRes, intRes] = await Promise.all([
        fetch("/api/health/token"),
        supabase.from("health_integrations").select("provider,is_active,last_synced_at").eq("client_id", user.id),
      ]);

      const tokenData = await tokenRes.json();
      setToken(tokenData.token ?? null);
      setIntegrations((intRes.data ?? []) as Integration[]);
      setLoading(false);
    }
    load();
  }, []);

  const stravaInt = integrations.find((i) => i.provider === "strava" && i.is_active);

  async function handleStravaSync() {
    setStravaSyncing(true); setSyncMsg(null);
    const res = await fetch("/api/strava/sync", { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      setSyncMsg({ type: "ok", text: `${d.activitiesSynced} atividades sincronizadas!` });
      // Refresh integrations to update last_synced_at
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("health_integrations").select("provider,is_active,last_synced_at").eq("client_id", user.id);
        setIntegrations((data ?? []) as Integration[]);
      }
    } else {
      setSyncMsg({ type: "err", text: d.error ?? "Erro ao sincronizar." });
    }
    setStravaSyncing(false);
    setTimeout(() => setSyncMsg(null), 4000);
  }

  async function handleStravaDisconnect() {
    await fetch("/api/strava/sync", { method: "DELETE" });
    setIntegrations((prev) => prev.filter((i) => i.provider !== "strava"));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 text-sm mt-1">Liga os teus dispositivos de fitness para sincronizar passos e dados de saúde automaticamente.</p>
      </div>

      {/* OAuth result banners */}
      {connected === "strava" && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-green-400 text-sm font-semibold">
          ✓ Strava ligado com sucesso!
        </div>
      )}
      {oauthError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          Erro ao ligar: {oauthError.replace(/_/g, " ")}. Tenta novamente.
        </div>
      )}
      {syncMsg && (
        <div className={`rounded-2xl p-3 text-sm font-semibold ${syncMsg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {syncMsg.text}
        </div>
      )}

      {/* Apple Health — via Shortcuts */}
      <div className="card p-5">
        {!showApple ? (
          <ProviderCard
            icon="🍎"
            name="Apple Health"
            description="Apple Watch, iPhone. Liga via Atalhos iOS para enviar automaticamente os teus passos diários."
            connected={false}
            onConnect={() => setShowApple(true)}
          />
        ) : (
          <AppleShortcutSection token={token ?? ""} />
        )}
      </div>

      {/* Strava */}
      <ProviderCard
        icon={
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FC4C02">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        }
        name="Strava"
        description="Sincroniza automaticamente atividades do Strava (corridas, ciclismo, natação). Compatível com Garmin, Polar, Wahoo e mais."
        connected={!!stravaInt}
        lastSynced={stravaInt?.last_synced_at}
        onConnect={() => { window.location.href = "/api/strava/connect"; }}
        onSync={handleStravaSync}
        onDisconnect={handleStravaDisconnect}
        syncing={stravaSyncing}
      />

      {/* Coming soon */}
      <ProviderCard
        icon="🏃"
        name="Google Fit / Health Connect"
        description="Android, Google Pixel Watch, Fitbit. Sincroniza passos e atividades diretamente."
        connected={false}
        comingSoon
      />
      <ProviderCard
        icon="⌚"
        name="Garmin Connect"
        description="Garmin Forerunner, Fenix, Venu. Sincroniza passos, sono e dados de saúde detalhados."
        connected={false}
        comingSoon
      />
      <ProviderCard
        icon="💜"
        name="Fitbit"
        description="Fitbit Charge, Sense, Versa. Passos, sono, frequência cardíaca em repouso."
        connected={false}
        comingSoon
      />

      {/* Info box */}
      <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">O que é sincronizado</p>
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Passos diários</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> Atividades (Strava)</div>
          <div className="flex items-center gap-2"><span className="text-zinc-600">–</span> Frequência cardíaca (em breve)</div>
          <div className="flex items-center gap-2"><span className="text-zinc-600">–</span> Qualidade do sono (em breve)</div>
        </div>
        <p className="text-zinc-600 text-[11px] pt-1">Os dados são usados apenas para o leaderboard e registo diário. O teu coach pode ver os passos sincronizados.</p>
      </div>
    </div>
  );
}
