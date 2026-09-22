"use client";

import { useActionState } from "react";
import { requestAdminMagicLink, type MagicLinkState } from "@/lib/actions/admin-auth";

const initialState: MagicLinkState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(requestAdminMagicLink, initialState);

  if (state.sent) {
    return (
      <p className="mt-6 rounded-sm border border-line bg-paper p-4 text-sm text-ink-soft">
        If that email is approved for admin access, a sign-in link is on its way. Check your
        inbox.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-ink">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="min-h-11 rounded-sm border border-line bg-paper px-3 text-ink"
      />
      {state.error && (
        <p role="alert" className="text-sm text-terracotta">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex min-h-11 items-center justify-center rounded-sm bg-green px-4 text-sm font-medium text-cream disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
