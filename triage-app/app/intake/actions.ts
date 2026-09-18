"use server";

import { redirect } from "next/navigation";
import { composeStructuredIntake, validatePasteIntake, validateStructuredIntake } from "@/lib/intake";
import { createReferral } from "@/lib/referrals";

export type IntakeFormState = { error: string } | null;

export async function submitPasteIntake(prevState: IntakeFormState, formData: FormData): Promise<IntakeFormState> {
  const result = validatePasteIntake(String(formData.get("rawText") ?? ""));
  if (!result.ok) {
    return { error: result.error };
  }

  const referral = await createReferral({ source: "paste", rawText: result.value });
  redirect(`/referrals/${referral.id}`);
}

export async function submitStructuredIntake(
  prevState: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const result = validateStructuredIntake({
    patientName: String(formData.get("patientName") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    referringClinician: String(formData.get("referringClinician") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!result.ok) {
    return { error: result.error };
  }

  const referral = await createReferral({ source: "form", rawText: composeStructuredIntake(result.value) });
  redirect(`/referrals/${referral.id}`);
}
