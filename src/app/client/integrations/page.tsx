"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/useLang";

interface Integration {
  provider: string;
  is_active: boolean;
  last_synced_at: string | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";

const t = {
  title:           { pt: "Integrações",          en: "Integrations" },
  sub:             { pt: "Liga os teus dispositivos para sincronizar passos automaticamente.", en: "Connect your devices to sync steps automatically." },
  coming_soon:     { pt: "Em breve",              en: "Coming soon" },
  connected:       { pt: "Ligado",               en: "Connected" },
  last_sync:       { pt: "Última sincronização:", en: "Last synced:" },
  sync:            { pt: "Sincronizar",           en: "Sync" },
  disconnect:      { pt: "Desligar",              en: "Disconnect" },
  connect:         { pt: "Configurar",            en: "Set up" },
  strava_ok:       { pt: "✓ Strava ligado com sucesso!", en: "✓ Strava connected successfully!" },
  oauth_error:     { pt: "Erro ao ligar",         en: "Error connecting" },
  try_again:       { pt: "Tenta novamente.",       en: "Please try again." },
  synced_acts:     { pt: "atividades sincronizadas!", en: "activities synced!" },
  sync_error:      { pt: "Erro ao sincronizar.",  en: "Error syncing." },
  strava_desc:     { pt: "Sincroniza atividades do Strava (corridas, ciclismo, natação). Compatível com Garmin, Polar, Wahoo e mais.", en: "Sync Strava activities (running, cycling, swimming). Compatible with Garmin, Polar, Wahoo and more." },
  garmin_desc:     { pt: "Garmin Forerunner, Fenix, Venu. Sincroniza passos, sono e dados de saúde detalhados.", en: "Garmin Forerunner, Fenix, Venu. Sync steps, sleep and detailed health data." },
  fitbit_desc:     { pt: "Fitbit Charge, Sense, Versa. Passos, sono, frequência cardíaca em repouso.", en: "Fitbit Charge, Sense, Versa. Steps, sleep, resting heart rate." },
  what_synced:     { pt: "O que é sincronizado",  en: "What gets synced" },
  steps:           { pt: "Passos diários",        en: "Daily steps" },
  activities:      { pt: "Atividades (Strava)",   en: "Activities (Strava)" },
  hr_soon:         { pt: "Frequência cardíaca (em breve)", en: "Heart rate (coming soon)" },
  sleep_soon:      { pt: "Qualidade do sono (em breve)",   en: "Sleep quality (coming soon)" },
  data_note:       { pt: "Os dados são usados apenas para o leaderboard e registo diário. O teu coach pode ver os passos sincronizados.", en: "Data is only used for the leaderboard and daily log. Your coach can see synced steps." },
  back:            { pt: "← Voltar",              en: "← Back" },
  next:            { pt: "Próximo →",             en: "Next →" },
  done:            { pt: "✓ Concluído",           en: "✓ Done" },
  copy:            { pt: "Copiar",                en: "Copy" },
  copied:          { pt: "✓ Copiado",             en: "✓ Copied" },
  iphone_tab:      { pt: "iPhone",                en: "iPhone" },
  android_tab:     { pt: "Android",               en: "Android" },
  your_link:       { pt: "O teu link pessoal (privado, não partilhes)", en: "Your personal link (private, do not share)" },
  steps_connected: { pt: "Passos sincronizados", en: "Steps synced" },
  steps_last:      { pt: "Último registo:", en: "Last record:" },
  steps_reconfigure: { pt: "Reconfigurar", en: "Reconfigure" },
  steps_connected_desc: { pt: "O teu dispositivo está a enviar passos corretamente.", en: "Your device is sending steps correctly." },

  apple_title:     { pt: "Apple Health, Passos Diários", en: "Apple Health, Daily Steps" },
  apple_subtitle:  { pt: "iPhone · Apple Watch · iOS 16+", en: "iPhone · Apple Watch · iOS 16+" },
  s1_title:        { pt: "Passo 1, Criar o Atalho", en: "Step 1, Create the Shortcut" },
  s1_intro:        { pt: "Abre a app Atalhos no iPhone e toca em + para criar um novo atalho. Dá-lhe o nome KRAV Sync.", en: "Open the Shortcuts app on your iPhone and tap + to create a new shortcut. Name it KRAV Sync." },
  s1a_title:       { pt: "1.ª Ação, Procurar Amostras de Saúde", en: "1st Action, Find Health Samples" },
  s1a_steps:       {
    pt: ["Toca em Adicionar Ação", "Pesquisa \"Amostras de Saúde\" (ou em inglês: Health Samples)", "Seleciona Procurar Amostras de Saúde", "Toca em Tipo → escolhe Passos (Steps)", "Toca no campo de data → escolhe Hoje (Today)"],
    en: ["Tap Add Action", "Search for \"Health Samples\" or \"Find Health Samples\"", "Select Find Health Samples", "Tap Type → choose Steps", "Tap the date field → choose Today"],
  },
  s1a_note:        { pt: "A ação deve ficar: \"Procurar Amostras de Saúde onde Tipo é Passos e Data de Início é Hoje\"", en: "The action should read: \"Find Health Samples where Type is Steps and Start Date is Today\"" },
  s1b_title:       { pt: "2.ª Ação, Calcular Estatísticas", en: "2nd Action, Calculate Statistics" },
  s1b_steps:       {
    pt: ["Toca em Adicionar Ação", "Pesquisa \"Calcular Estatísticas\" (ou Calculate Statistics)", "Seleciona Calcular Estatísticas", "Verifica que está como Soma (Sum) das Amostras de Saúde"],
    en: ["Tap Add Action", "Search for \"Calculate Statistics\"", "Select Calculate Statistics", "Verify it's set to Sum of Health Samples"],
  },
  s1c_title:       { pt: "3.ª Ação, Texto (para construir o URL)", en: "3rd Action, Text (to build the URL)" },
  s1c_steps:       {
    pt: ["Toca em Adicionar Ação", "Pesquisa \"Texto\" (ou Text)", "Seleciona a ação Texto"],
    en: ["Tap Add Action", "Search for \"Text\"", "Select the Text action"],
  },
  s1c_paste:       { pt: "Copia o teu link pessoal abaixo e cola-o no campo de texto", en: "Copy your personal link below and paste it into the text field" },
  s1c_ampsteps:    { pt: "A seguir ao link, escreve exatamente:", en: "After the link, type exactly:" },
  s1c_variable:    { pt: "A seguir ao = , toca no ícone de variável (bolinha laranja/azul) e seleciona Resultado da Estatística (ou Calculated Result / Estatística Calculada)", en: "After the =, tap the variable icon (orange/blue dot) and select Statistic Result (Calculated Result)" },
  s1c_warning:     { pt: "⚠️ Importante: usa sempre a ação Texto para construir o URL, a ação \"Conteúdos de URL\" não aceita variáveis inline no campo do URL.", en: "⚠️ Important: always use the Text action to build the URL, the \"Get Contents of URL\" action does not accept inline variables in its URL field." },
  s1d_title:       { pt: "4.ª Ação, Conteúdos de URL", en: "4th Action, Get Contents of URL" },
  s1d_steps:       {
    pt: ["Toca em Adicionar Ação", "Pesquisa \"Conteúdos de URL\" (ou Get Contents of URL)", "Seleciona Conteúdos de URL", "No campo do URL, toca na variável mágica (bolinha) e seleciona o Texto da ação anterior", "O Método deve estar como GET. Não alteres nada mais", "Toca em Concluído (Done) para guardar o atalho"],
    en: ["Tap Add Action", "Search for \"Get Contents of URL\"", "Select Get Contents of URL", "In the URL field, tap the magic variable (dot icon) and select the Text from the previous action", "Method should be GET, don't change anything else", "Tap Done to save the shortcut"],
  },
  s1_test:         { pt: "Executa o atalho uma vez para dar permissão ao Apple Health. Se aparecer {\"ok\":true} ou \"Nenhum dado para guardar\", está a funcionar corretamente.", en: "Run the shortcut once to grant Apple Health permission. If you see {\"ok\":true} or \"No data to save\", it's working correctly." },
  s2_title:        { pt: "Passo 2, Automatizar (todos os dias às 23:30)", en: "Step 2, Automate (every day at 23:30)" },
  s2_intro:        { pt: "Para os passos serem enviados automaticamente todos os dias sem teres de fazer nada:", en: "To have your steps sent automatically every day without doing anything:" },
  s2_steps:        {
    pt: ["Na app Atalhos, vai ao separador Automação (ícone do relógio)", "Toca em + e depois em Criar Automação Pessoal", "Escolhe Hora do Dia → define 23:30", "Toca em Adicionar Ação → pesquisa \"Executar Atalho\" → seleciona Executar Atalho", "Na ação, toca em Atalho e seleciona KRAV Sync", "Desativa a opção \"Perguntar antes de executar\" → toca em Concluído"],
    en: ["In the Shortcuts app, go to the Automation tab (clock icon)", "Tap + then Create Personal Automation", "Choose Time of Day → set 23:30", "Tap Add Action → search \"Run Shortcut\" → select Run Shortcut", "In the action, tap Shortcut and select KRAV Sync", "Disable \"Ask Before Running\" → tap Done"],
  },
  s2_done:         { pt: "✓ Pronto! Os teus passos serão enviados automaticamente todos os dias às 23:30.", en: "✓ Done! Your steps will sync automatically every day at 23:30." },

  android_title:   { pt: "Android, Passos Diários", en: "Android, Daily Steps" },
  android_subtitle:{ pt: "Android 10+ · Google Fit · Samsung Health", en: "Android 10+ · Google Fit · Samsung Health" },
  android_intro:   { pt: "No Android não existe uma app nativa equivalente aos Atalhos do iPhone. A solução mais simples e gratuita é usar o MacroDroid, que lê os teus passos e os envia automaticamente.", en: "Android doesn't have a native app equivalent to iPhone Shortcuts. The simplest free solution is MacroDroid, which reads your steps and sends them automatically." },
  and_s1_title:    { pt: "Passo 1, Instala o MacroDroid", en: "Step 1, Install MacroDroid" },
  and_s1_steps:    {
    pt: ["Abre a Play Store no teu Android", "Pesquisa \"MacroDroid\" e instala a app (é gratuita)", "Abre o MacroDroid e aceita as permissões necessárias"],
    en: ["Open the Play Store on your Android", "Search for \"MacroDroid\" and install the app (it's free)", "Open MacroDroid and accept the required permissions"],
  },
  and_s2_title:    { pt: "Passo 2, Cria a macro de sincronização", en: "Step 2, Create the sync macro" },
  and_s2_intro:    {
    pt: ["Na MacroDroid, toca em + para criar uma nova Macro", "Dá o nome \"KRAV Sync\" à macro"],
    en: ["In MacroDroid, tap + to create a new Macro", "Name the macro \"KRAV Sync\""],
  },
  and_s2_trigger:  { pt: "Gatilho (quando executa):", en: "Trigger (when it runs):" },
  and_s2_t:        {
    pt: ["Toca em Gatilhos → Hora/Data → Temporizador", "Define para todos os dias às 23:30"],
    en: ["Tap Triggers → Date/Time → Timer", "Set to every day at 23:30"],
  },
  and_s2_action:   { pt: "Ações (o que faz):", en: "Actions (what it does):" },
  and_s2_a:        {
    pt: ["Toca em Ações → Conectividade → HTTP Request / Pedido HTTP", "No campo URL, cola o teu link pessoal (abaixo)", "Após o link, escreve &steps= e depois toca em {} para inserir uma variável do sistema", "Pesquisa \"Steps\" ou \"Pedómetro\" na lista de variáveis e seleciona os passos do dia de hoje", "Define o Método como GET", "Toca em OK para guardar a ação e depois em Guardar para guardar a macro"],
    en: ["Tap Actions → Connectivity → HTTP Request", "In the URL field, paste your personal link (below)", "After the link, type &steps= then tap {} to insert a system variable", "Search \"Steps\" or \"Pedometer\" in the variables list and select today's steps", "Set Method to GET", "Tap OK to save the action, then Save to save the macro"],
  },
  and_s3_title:    { pt: "Passo 3, Ativa e testa", en: "Step 3, Enable and test" },
  and_s3_steps:    {
    pt: ["Na lista de macros, ativa o toggle ao lado de \"KRAV Sync\"", "Para testar, toca na macro e escolhe Executar, deves ver uma resposta do servidor"],
    en: ["In the macro list, enable the toggle next to \"KRAV Sync\"", "To test, tap the macro and choose Run, you should see a server response"],
  },
  and_s3_done:     { pt: "✓ Pronto! Os teus passos serão enviados automaticamente todas as noites.", en: "✓ Done! Your steps will be sent automatically every night." },
  and_alt_title:   { pt: "Alternativa sem MacroDroid", en: "Alternative without MacroDroid" },
  and_alt_text:    { pt: "Podes usar o Tasker (pago) ou qualquer app de automação que suporte pedidos HTTP. O URL a usar é o teu link pessoal com &steps=NÚMERO_DE_PASSOS no final.", en: "You can use Tasker (paid) or any automation app that supports HTTP requests. The URL to use is your personal link with &steps=NUMBER_OF_STEPS at the end." },
} as const;

function CopyBox({ url, lang }: { url: string; lang: "pt" | "en" }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="space-y-1.5">
      <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">{t.your_link[lang]}</p>
      <div className="flex gap-2">
        <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 font-mono text-[10px] text-gray-300 truncate">
          {url}
        </div>
        <button
          onClick={copy}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors ${
            copied ? "bg-green-500/20 text-green-400" : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20"
          }`}
        >
          {copied ? t.copied[lang] : t.copy[lang]}
        </button>
      </div>
    </div>
  );
}

function NumberedList({ items }: { items: readonly string[] }) {
  return (
    <ol className="space-y-1.5 list-none">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
          <span className="text-brand-gold/70 font-bold flex-shrink-0">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="w-6 h-6 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-bold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <p className="text-white text-xs font-semibold">{title}</p>
    </div>
  );
}

function IphoneSection({ token, lang }: { token: string; lang: "pt" | "en" }) {
  const [step, setStep] = useState<1 | 2>(1);
  const syncUrl = `${SITE_URL}/api/health/sync?token=${token}`;
  const l = lang;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">🍎</div>
        <div>
          <p className="text-white font-semibold text-sm">{t.apple_title[l]}</p>
          <p className="text-gray-500 text-[11px]">{t.apple_subtitle[l]}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {([1, 2] as const).map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-brand-gold" : "bg-zinc-800"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-bold">{t.s1_title[l]}</p>
          <p className="text-gray-400 text-xs leading-relaxed">{t.s1_intro[l]}</p>

          <SectionHeader num={1} title={t.s1a_title[l]} />
          <NumberedList items={t.s1a_steps[l]} />
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-xl p-2.5 text-xs text-gray-500 italic leading-relaxed ml-8">
            {t.s1a_note[l]}
          </div>

          <SectionHeader num={2} title={t.s1b_title[l]} />
          <NumberedList items={t.s1b_steps[l]} />

          <SectionHeader num={3} title={t.s1c_title[l]} />
          <NumberedList items={t.s1c_steps[l]} />
          <ol className="space-y-1.5 list-none ml-0" style={{ counterReset: "none" }}>
            <li className="flex gap-2 text-xs text-gray-400 leading-relaxed">
              <span className="text-brand-gold/70 font-bold flex-shrink-0">4.</span>
              <span>{t.s1c_paste[l]} <span className="text-brand-gold">↓</span></span>
            </li>
            <li className="flex gap-2 text-xs text-gray-400 leading-relaxed">
              <span className="text-brand-gold/70 font-bold flex-shrink-0">5.</span>
              <span>{t.s1c_ampsteps[l]} <code className="text-brand-gold bg-zinc-900 px-1 rounded font-mono">&amp;steps=</code></span>
            </li>
            <li className="flex gap-2 text-xs text-gray-400 leading-relaxed">
              <span className="text-brand-gold/70 font-bold flex-shrink-0">6.</span>
              <span>{t.s1c_variable[l]}</span>
            </li>
          </ol>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400/80 leading-relaxed">
            {t.s1c_warning[l]}
          </div>

          <CopyBox url={syncUrl} lang={l} />

          <SectionHeader num={4} title={t.s1d_title[l]} />
          <NumberedList items={t.s1d_steps[l]} />

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400 leading-relaxed">
            {t.s1_test[l]}
          </div>

          <button onClick={() => setStep(2)} className="w-full btn-primary py-3 text-sm font-semibold mt-2">
            {t.next[l]}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-bold">{t.s2_title[l]}</p>
          <p className="text-gray-400 text-xs leading-relaxed">{t.s2_intro[l]}</p>
          <NumberedList items={t.s2_steps[l]} />
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400 font-semibold">
            {t.s2_done[l]}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-zinc-800 hover:bg-zinc-700 transition-colors">
              {t.back[l]}
            </button>
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors font-semibold">
              {t.done[l]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AndroidSection({ token, lang }: { token: string; lang: "pt" | "en" }) {
  const syncUrl = `${SITE_URL}/api/health/sync?token=${token}`;
  const l = lang;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
        <div>
          <p className="text-white font-semibold text-sm">{t.android_title[l]}</p>
          <p className="text-gray-500 text-[11px]">{t.android_subtitle[l]}</p>
        </div>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed">{t.android_intro[l]}</p>

      <div>
        <p className="text-white text-sm font-bold mb-3">{t.and_s1_title[l]}</p>
        <NumberedList items={t.and_s1_steps[l]} />
      </div>

      <div>
        <p className="text-white text-sm font-bold mb-3">{t.and_s2_title[l]}</p>
        <NumberedList items={t.and_s2_intro[l]} />

        <p className="text-gray-300 text-xs font-semibold mt-3 mb-2">{t.and_s2_trigger[l]}</p>
        <ol className="space-y-1.5 list-none">
          {t.and_s2_t[l].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
              <span className="text-brand-gold/70 font-bold flex-shrink-0">{i + 3}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <p className="text-gray-300 text-xs font-semibold mt-3 mb-2">{t.and_s2_action[l]}</p>
        <ol className="space-y-1.5 list-none">
          {t.and_s2_a[l].map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
              <span className="text-brand-gold/70 font-bold flex-shrink-0">{i + 5}.</span>
              <span>{i === 1 ? <>{item} <span className="text-brand-gold">↓</span></> : item}</span>
            </li>
          ))}
        </ol>

        <div className="mt-3">
          <CopyBox url={syncUrl} lang={l} />
        </div>
      </div>

      <div>
        <p className="text-white text-sm font-bold mb-3">{t.and_s3_title[l]}</p>
        <NumberedList items={t.and_s3_steps[l]} />
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-400 font-semibold">
        {t.and_s3_done[l]}
      </div>

      <div className="bg-zinc-900 rounded-xl p-4 space-y-1.5">
        <p className="text-gray-400 text-xs font-semibold">{t.and_alt_title[l]}</p>
        <p className="text-gray-500 text-xs leading-relaxed">{t.and_alt_text[l]}</p>
      </div>
    </div>
  );
}

function ProviderCard({
  icon, name, description, connected, lastSynced, onConnect, onSync, onDisconnect, syncing, comingSoon, lang,
}: {
  icon: React.ReactNode; name: string; description: string; connected: boolean;
  lastSynced?: string | null; onConnect?: () => void; onSync?: () => void;
  onDisconnect?: () => void; syncing?: boolean; comingSoon?: boolean; lang: "pt" | "en";
}) {
  const locale = lang === "en" ? "en-GB" : "pt-PT";
  return (
    <div className={`card p-4 flex items-start gap-4 ${comingSoon ? "opacity-50" : ""}`}>
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold">{name}</p>
          {comingSoon && <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">{t.coming_soon[lang]}</span>}
          {connected && !comingSoon && <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold">{t.connected[lang]}</span>}
        </div>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{description}</p>
        {connected && lastSynced && (
          <p className="text-gray-600 text-[11px] mt-1">
            {t.last_sync[lang]} {new Date(lastSynced).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
      {!comingSoon && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          {connected ? (
            <>
              {onSync && (
                <button onClick={onSync} disabled={syncing} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors disabled:opacity-40">
                  {syncing ? "…" : t.sync[lang]}
                </button>
              )}
              {onDisconnect && (
                <button onClick={onDisconnect} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-gray-500 hover:text-red-400 transition-colors">
                  {t.disconnect[lang]}
                </button>
              )}
            </>
          ) : (
            onConnect && (
              <button onClick={onConnect} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700 transition-colors whitespace-nowrap">
                {t.connect[lang]}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [hasSyncedSteps, setHasSyncedSteps] = useState(false);
  const [lastStepSync, setLastStepSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<"iphone" | "android">("iphone");
  const [showHealthSection, setShowHealthSection] = useState(false);
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

      // Check if user has ever synced steps via shortcut
      const { data: healthLog } = await supabase
        .from("daily_health_logs")
        .select("log_date")
        .eq("client_id", user.id)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (healthLog) {
        setHasSyncedSteps(true);
        setLastStepSync(healthLog.log_date as string);
      }

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
      setSyncMsg({ type: "ok", text: `${d.activitiesSynced} ${t.synced_acts[lang]}` });
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("health_integrations").select("provider,is_active,last_synced_at").eq("client_id", user.id);
        setIntegrations((data ?? []) as Integration[]);
      }
    } else {
      setSyncMsg({ type: "err", text: d.error ?? t.sync_error[lang] });
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
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title[lang]}</h1>
        <p className="text-gray-400 text-sm mt-1">{t.sub[lang]}</p>
      </div>

      {connected === "strava" && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-green-400 text-sm font-semibold">
          {t.strava_ok[lang]}
        </div>
      )}
      {oauthError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
          {t.oauth_error[lang]}: {oauthError.replace(/_/g, " ")}. {t.try_again[lang]}
        </div>
      )}
      {syncMsg && (
        <div className={`rounded-2xl p-3 text-sm font-semibold ${syncMsg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {syncMsg.text}
        </div>
      )}

      {/* Health sync card */}
      <div className="card p-5">
        {!showHealthSection ? (
          hasSyncedSteps ? (
            /* Connected state */
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">📱</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">{lang === "pt" ? "Sincronização de Passos" : "Step Sync"}</p>
                  <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold">{t.steps_connected[lang]}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">{t.steps_connected_desc[lang]}</p>
                {lastStepSync && (
                  <p className="text-gray-600 text-[11px] mt-1">
                    {t.steps_last[lang]} {new Date(lastStepSync).toLocaleDateString(lang === "en" ? "en-GB" : "pt-PT", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowHealthSection(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
              >
                {t.steps_reconfigure[lang]}
              </button>
            </div>
          ) : (
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold">{lang === "pt" ? "Sincronização de Passos" : "Step Sync"}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {lang === "pt" ? "Configura o teu dispositivo para enviar os passos diários automaticamente." : "Set up your device to send daily steps automatically."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setPlatform("iphone"); setShowHealthSection(true); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                <span className="text-2xl">🍎</span>
                <span className="text-white text-sm font-semibold">iPhone</span>
                <span className="text-gray-500 text-[11px]">iOS Shortcuts</span>
              </button>
              <button
                onClick={() => { setPlatform("android"); setShowHealthSection(true); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                <span className="text-2xl">🤖</span>
                <span className="text-white text-sm font-semibold">Android</span>
                <span className="text-gray-500 text-[11px]">MacroDroid</span>
              </button>
            </div>
          </div>
          )
        ) : (
          <div className="space-y-4">
            {/* Platform tabs */}
            <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
              <button
                onClick={() => setPlatform("iphone")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${platform === "iphone" ? "bg-zinc-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                🍎 {t.iphone_tab[lang]}
              </button>
              <button
                onClick={() => setPlatform("android")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${platform === "android" ? "bg-zinc-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                🤖 {t.android_tab[lang]}
              </button>
            </div>

            {platform === "iphone" ? (
              <IphoneSection token={token ?? ""} lang={lang} />
            ) : (
              <AndroidSection token={token ?? ""} lang={lang} />
            )}

            <button
              onClick={() => setShowHealthSection(false)}
              className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {t.back[lang]}
            </button>
          </div>
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
        description={t.strava_desc[lang]}
        connected={!!stravaInt}
        lastSynced={stravaInt?.last_synced_at}
        onConnect={() => { window.location.href = "/api/strava/connect"; }}
        onSync={handleStravaSync}
        onDisconnect={handleStravaDisconnect}
        syncing={stravaSyncing}
        lang={lang}
      />

      <ProviderCard icon="⌚" name="Garmin Connect" description={t.garmin_desc[lang]} connected={false} comingSoon lang={lang} />
      <ProviderCard icon="💜" name="Fitbit" description={t.fitbit_desc[lang]} connected={false} comingSoon lang={lang} />

      <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{t.what_synced[lang]}</p>
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> {t.steps[lang]}</div>
          <div className="flex items-center gap-2"><span className="text-green-400">✓</span> {t.activities[lang]}</div>
          <div className="flex items-center gap-2"><span className="text-zinc-600">–</span> {t.hr_soon[lang]}</div>
          <div className="flex items-center gap-2"><span className="text-zinc-600">–</span> {t.sleep_soon[lang]}</div>
        </div>
        <p className="text-zinc-600 text-[11px] pt-1">{t.data_note[lang]}</p>
      </div>
    </div>
  );
}
