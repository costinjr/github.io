"use client";

import { useActionState } from "react";
import { REFERRAL_STATUSES } from "@/lib/types";
import type { ReferralStatus } from "@/lib/types";
import { changeStatusAction } from "./actions";

export function StatusForm({ referralId, currentStatus }: { referralId: string; currentStatus: ReferralStatus }) {
  const [state, formAction, pending] = useActionState(changeStatusAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="referralId" value={referralId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground/70">Status</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20"
        >
          {REFERRAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update status"}
      </button>
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
