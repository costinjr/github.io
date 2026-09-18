"use client";

import { useActionState } from "react";
import { addNoteAction } from "./actions";

export function NoteForm({ referralId }: { referralId: string }) {
  const [state, formAction, pending] = useActionState(addNoteAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="referralId" value={referralId} />
      <label htmlFor="note" className="text-sm font-medium">
        Internal note
      </label>
      <textarea
        id="note"
        name="note"
        rows={2}
        required
        className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
      />
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-black/15 px-3 py-2 text-sm font-medium disabled:opacity-60 dark:border-white/20"
      >
        {pending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
