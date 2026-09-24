"use client";

import { useState } from "react";

/**
 * Copies the client's payment link.
 *
 * The coach used to paste the raw Stripe Checkout URL into a message: four
 * lines of random characters from checkout.stripe.com, which reads like a scam
 * and expires within a day. This is short, on kravcoaching.com, and builds the
 * Stripe session when the client opens it.
 */
export default function PayLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  function copy() {
    setFailed(false);
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      },
      () => setFailed(true),
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={copy}
        className="text-sm px-4 py-2 rounded-xl font-semibold transition-colors"
        style={{
          background: copied ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${copied ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.1)"}`,
          color: copied ? "#4ade80" : "#d4d4d8",
        }}
      >
        {copied ? "Link copiado ✓" : "Copiar link de pagamento"}
      </button>
      {failed && (
        <span className="text-[11px] text-zinc-500 max-w-[260px] text-right break-all">
          Não deu para copiar. O link é {link}
        </span>
      )}
    </div>
  );
}
