"use client";

import { useFormStatus } from "react-dom";

/** Its own component so the pending state belongs to this form alone. */
export function StartProgram90Button({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl py-3 text-sm font-bold text-black transition-all active:scale-95 disabled:opacity-60"
      style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
