"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getReferralById } from "@/lib/referrals";
import { runTriagePipeline } from "@/lib/triage";
import { REFERRAL_STATUSES } from "@/lib/types";
import type { ReferralStatus } from "@/lib/types";
import { addWorkflowNote, changeReferralStatus } from "@/lib/workflow";

export type DetailFormState = { error: string } | null;

function isReferralStatus(value: string): value is ReferralStatus {
  return (REFERRAL_STATUSES as readonly string[]).includes(value);
}

export async function changeStatusAction(prevState: DetailFormState, formData: FormData): Promise<DetailFormState> {
  const referralId = String(formData.get("referralId") ?? "");
  const toStatus = String(formData.get("status") ?? "");

  if (!isReferralStatus(toStatus)) {
    return { error: "Choose a valid status." };
  }

  const referral = await getReferralById(referralId);
  if (!referral) {
    return { error: "This referral no longer exists." };
  }

  if (referral.status !== toStatus) {
    await changeReferralStatus(referralId, referral.status, toStatus);
    revalidatePath(`/referrals/${referralId}`);
  }
  return null;
}

export async function addNoteAction(prevState: DetailFormState, formData: FormData): Promise<DetailFormState> {
  const referralId = String(formData.get("referralId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (note.length === 0) {
    return { error: "Write a note before submitting." };
  }

  const referral = await getReferralById(referralId);
  if (!referral) {
    return { error: "This referral no longer exists." };
  }

  await addWorkflowNote(referralId, note);
  revalidatePath(`/referrals/${referralId}`);
  return null;
}

// Always creates a new triage_runs row rather than overwriting the last
// one — this same action backs both "Run Triage" and "Re-run Triage".
export async function triageAction(formData: FormData): Promise<void> {
  const referralId = String(formData.get("referralId") ?? "");

  const referral = await getReferralById(referralId);
  if (!referral) {
    notFound();
  }

  await runTriagePipeline(referral);
  redirect(`/referrals/${referralId}`);
}
