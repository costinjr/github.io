"use client";

import { useActionState } from "react";
import { submitPasteIntake } from "./actions";

export function PasteForm() {
  const [state, formAction, pending] = useActionState(submitPasteIntake, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="rawText" className="text-sm font-medium">
        Paste the referral exactly as received
      </label>
      <textarea
        id="rawText"
        name="rawText"
        rows={12}
        required
        className="rounded-md border border-black/15 bg-transparent p-3 font-mono text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        placeholder="STAT - Dr. Elena Park requesting same-day review..."
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save referral"}
      </button>
    </form>
  );
}
