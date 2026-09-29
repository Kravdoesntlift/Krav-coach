"use client";

import { useFormStatus } from "react-dom";

/**
 * One per form, so the spinner belongs to the tier that was pressed rather
 * than to both buttons at once.
 */
export function PaywallSubscribeButton({
  label,
  pendingLabel,
  variant = "primary",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  const style =
    variant === "primary"
      ? { background: "linear-gradient(135deg,#E8C96B,#C9A84C)", color: "#000" }
      : {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "#e4e4e7",
        };

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-bold py-3.5 rounded-xl transition-all text-center text-sm disabled:opacity-70 disabled:cursor-not-allowed"
      style={style}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
