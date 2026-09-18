export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validatePasteIntake(rawText: string): ValidationResult<string> {
  const trimmed = rawText.trim();
  if (trimmed.length < 5) {
    return { ok: false, error: "Paste the referral text before submitting." };
  }
  return { ok: true, value: trimmed };
}

export type StructuredIntakeFields = {
  patientName: string;
  contactPhone: string;
  referringClinician: string;
  reason: string;
  notes: string;
};

export function validateStructuredIntake(fields: StructuredIntakeFields): ValidationResult<StructuredIntakeFields> {
  if (fields.reason.trim().length === 0) {
    return { ok: false, error: "Reason for referral is required." };
  }
  return {
    ok: true,
    value: {
      patientName: fields.patientName.trim(),
      contactPhone: fields.contactPhone.trim(),
      referringClinician: fields.referringClinician.trim(),
      reason: fields.reason.trim(),
      notes: fields.notes.trim(),
    },
  };
}

// Renders structured fields into the same shape of free text a pasted
// referral would arrive as, so one extraction pipeline (added in a later
// session) can handle both intake paths uniformly.
export function composeStructuredIntake(fields: StructuredIntakeFields): string {
  const lines: string[] = [];
  if (fields.patientName) lines.push(`Patient: ${fields.patientName}`);
  if (fields.contactPhone) lines.push(`Contact: ${fields.contactPhone}`);
  if (fields.referringClinician) lines.push(`Referring clinician: ${fields.referringClinician}`);
  lines.push(`Reason for referral: ${fields.reason}`);
  if (fields.notes) lines.push(`Notes: ${fields.notes}`);
  return lines.join("\n");
}
