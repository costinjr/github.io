"use client";

import { useActionState } from "react";
import { unlock } from "./actions";

export function GateForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(unlock, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="passcode" className="text-sm font-medium text-foreground">
          Demo passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoFocus
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
