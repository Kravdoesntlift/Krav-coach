"use client";

import { useState, useTransition } from "react";

interface ClientBillingInfo {
  id: string;
  full_name: string;
  email: string;
  status: string;
  stripe_customer_id: string | null;
  subscription: {
    status: string;
    amount_cents: number | null;
    current_period_end: string | null;
  } | null;
}

interface Props {
  clients: ClientBillingInfo[];
  coachId: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-900/40 text-green-400" },
  past_due: { label: "Em atraso", className: "bg-orange-900/40 text-orange-400" },
  cancelled: { label: "Cancelado", className: "bg-red-900/40 text-red-400" },
  canceled: { label: "Cancelado", className: "bg-red-900/40 text-red-400" },
  trialing: { label: "Período de teste", className: "bg-blue-900/40 text-blue-400" },
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = status && STATUS_BADGE[status] ? STATUS_BADGE[status] : { label: "Sem subscrição", className: "bg-zinc-800 text-zinc-500" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}

function formatAmount(cents: number | null, currency = "EUR") {
  if (!cents) return "-";
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-PT");
}

const stripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function BillingClient({ clients }: Props) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  function handleCreateLink(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError(null);
    setGeneratedLink(null);
    if (!selectedClientId || !amount) {
      setCheckoutError("Seleciona um cliente e indica o valor.");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setCheckoutError("Valor inválido.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClientId,
            priceAmount: Math.round(amountNum * 100),
            currency: "eur",
            clientEmail: selectedClient?.email ?? "",
            clientName: selectedClient?.full_name ?? "",
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setCheckoutError(data.error ?? "Erro ao criar link.");
          return;
        }
        setGeneratedLink(data.url);
      } catch {
        setCheckoutError("Erro de ligação. Tenta novamente.");
      }
    });
  }

  function copyLink() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePortal(clientId: string) {
    setPortalError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setPortalError(data.error ?? "Erro ao abrir portal.");
          return;
        }
        window.open(data.url, "_blank");
      } catch {
        setPortalError("Erro de ligação. Tenta novamente.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Stripe not configured banner */}
      {!stripeConfigured && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}
        >
          <p className="text-brand-gold font-bold text-sm">Stripe não configurado</p>
          <p className="text-zinc-400 text-sm">
            Para activar pagamentos, adiciona as seguintes variáveis ao teu <code className="text-zinc-300 bg-zinc-800 px-1 rounded">.env.local</code>:
          </p>
          <pre className="text-xs text-zinc-300 bg-zinc-900 rounded-xl p-3 overflow-x-auto leading-relaxed">
{`STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`}
          </pre>
          <ol className="text-zinc-500 text-xs list-decimal list-inside space-y-1">
            <li>Cria uma conta em <span className="text-zinc-300">stripe.com</span></li>
            <li>Vai a Developers → API Keys para obter as chaves</li>
            <li>Configura o Webhook em Developers → Webhooks → <code className="bg-zinc-800 px-1 rounded">/api/stripe/webhook</code></li>
            <li>Reinicia o servidor após adicionar as variáveis</li>
          </ol>
        </div>
      )}

      {/* Create payment link */}
      <section className="card space-y-4">
        <h2 className="text-lg font-bold text-white">Criar link de pagamento</h2>
        <form onSubmit={handleCreateLink} className="space-y-4">
          {checkoutError && (
            <p className="text-red-400 text-sm">{checkoutError}</p>
          )}
          <div>
            <label className="label">Cliente</label>
            <select
              className="input w-full"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Seleciona um cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valor mensal (EUR)</label>
            <input
              className="input w-full"
              type="number"
              min="1"
              step="0.01"
              placeholder="Ex: 99.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !stripeConfigured}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "A criar..." : "Gerar link de pagamento"}
          </button>
          {!stripeConfigured && (
            <p className="text-zinc-600 text-xs">Configura o Stripe primeiro para criar links de pagamento.</p>
          )}
        </form>

        {/* Generated link */}
        {generatedLink && (
          <div className="mt-4 rounded-2xl p-4 space-y-3" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
            <p className="text-brand-gold text-sm font-bold">✅ Link gerado, partilha com o cliente:</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 truncate"
              />
              <button
                onClick={copyLink}
                className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(201,168,76,0.15)", color: copied ? "#4ade80" : "#C9A84C", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(201,168,76,0.3)"}` }}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Olá! Aqui está o teu link de pagamento para o KRAV Premium Coaching (€${amount}/mês): ${generatedLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
              >
                📱 Partilhar no WhatsApp
              </a>
              <a
                href={`mailto:${selectedClient?.email ?? ""}?subject=KRAV Premium Coaching, Link de Pagamento&body=${encodeURIComponent(`Olá!\n\nAqui está o teu link de pagamento para o KRAV Premium Coaching (€${amount}/mês):\n\n${generatedLink}\n\nQualquer dúvida, fala comigo.\n\nKrav`)}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ✉️ Enviar por Email
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Client subscriptions */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Subscrições dos clientes</h2>

        {portalError && (
          <p className="text-red-400 text-sm">{portalError}</p>
        )}

        {clients.length === 0 ? (
          <div className="card text-center py-12 text-zinc-500">
            <p>Sem clientes ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const sub = client.subscription;
              const subStatus = sub?.status ?? null;
              return (
                <div key={client.id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">{client.full_name}</p>
                      <StatusBadge status={subStatus} />
                    </div>
                    {client.email && (
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">{client.email}</p>
                    )}
                    {sub && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                        {sub.amount_cents && (
                          <span>{formatAmount(sub.amount_cents)}/mês</span>
                        )}
                        {sub.current_period_end && (
                          <span>Renova: {formatDate(sub.current_period_end)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {client.stripe_customer_id && stripeConfigured && (
                    <button
                      onClick={() => handlePortal(client.id)}
                      disabled={isPending}
                      className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50"
                    >
                      Portal Stripe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
