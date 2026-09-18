"use client";

import { useActionState } from "react";
import { submitStructuredIntake } from "./actions";

function Field({
  id,
  name,
  label,
  required,
  multiline,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const className =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? null : <span className="font-normal text-foreground/50"> (optional)</span>}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} required={required} className={className} />
      ) : (
        <input id={id} name={name} type="text" required={required} className={className} />
      )}
    </div>
  );
}

export function StructuredForm() {
  const [state, formAction, pending] = useActionState(submitStructuredIntake, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field id="patientName" name="patientName" label="Patient name" />
      <Field id="contactPhone" name="contactPhone" label="Patient contact" />
      <Field id="referringClinician" name="referringClinician" label="Referring clinician" />
      <Field id="reason" name="reason" label="Reason for referral" required multiline />
      <Field id="notes" name="notes" label="Additional notes" multiline />
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
