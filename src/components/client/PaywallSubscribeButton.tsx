"use client";

import { useFormStatus } from "react-dom";
import { useLang } from "@/lib/i18n/useLang";

export function PaywallSubscribeButton() {
  const { pending } = useFormStatus();
  const { lang } = useLang();
  const isEN = lang === "en";

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-bold text-black py-4 rounded-xl transition-all text-center disabled:opacity-70 disabled:cursor-not-allowed"
      style={{ background: "linear-gradient(135deg,#E8C96B,#C9A84C)" }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {isEN ? "Redirecting to payment..." : "A redirecionar para pagamento..."}
        </span>
      ) : (
        isEN ? "Subscribe now →" : "Subscrever agora →"
      )}
    </button>
  );
}
