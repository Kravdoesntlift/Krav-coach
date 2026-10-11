"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startProgram90Action, type ProgramActionState } from "@/app/client/program-action";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
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

/**
 * The form and its answer in one place, so a refusal is read rather than
 * swallowed: pressing a button and watching nothing happen is the worst
 * outcome this screen can produce.
 */
export function StartProgram90Button({
  label,
  pendingLabel,
  lang,
}: {
  label: string;
  pendingLabel: string;
  lang: "pt" | "en";
}) {
  const [state, action] = useActionState<ProgramActionState, FormData>(
    startProgram90Action,
    { ok: false, message: null },
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="lang" value={lang} />
      <Submit label={label} pendingLabel={pendingLabel} />
      {state.message && (
        <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
