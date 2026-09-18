import { describe, expect, it } from "vitest";
import { composeStructuredIntake, validatePasteIntake, validateStructuredIntake } from "./intake";
import type { StructuredIntakeFields } from "./intake";

describe("validatePasteIntake", () => {
  it("rejects empty or near-empty text", () => {
    expect(validatePasteIntake("").ok).toBe(false);
    expect(validatePasteIntake("   ").ok).toBe(false);
    expect(validatePasteIntake("hi").ok).toBe(false);
  });

  it("trims and accepts real text", () => {
    const result = validatePasteIntake("  Routine referral for a checkup.  ");
    expect(result).toEqual({ ok: true, value: "Routine referral for a checkup." });
  });
});

function makeFields(overrides: Partial<StructuredIntakeFields> = {}): StructuredIntakeFields {
  return {
    patientName: "",
    contactPhone: "",
    referringClinician: "",
    reason: "",
    notes: "",
    ...overrides,
  };
}

describe("validateStructuredIntake", () => {
  it("requires a reason", () => {
    expect(validateStructuredIntake(makeFields({ reason: "  " })).ok).toBe(false);
  });

  it("trims all fields and allows the optional ones to be blank", () => {
    const result = validateStructuredIntake(makeFields({ reason: " Knee pain ", patientName: " Riley Evans " }));
    expect(result).toEqual({
      ok: true,
      value: {
        patientName: "Riley Evans",
        contactPhone: "",
        referringClinician: "",
        reason: "Knee pain",
        notes: "",
      },
    });
  });
});

describe("composeStructuredIntake", () => {
  it("includes only the fields that were filled in, always including the reason", () => {
    const text = composeStructuredIntake(makeFields({ reason: "Rash getting worse" }));
    expect(text).toBe("Reason for referral: Rash getting worse");
  });

  it("includes every field in a fixed order when all are present", () => {
    const text = composeStructuredIntake({
      patientName: "Taylor Diaz",
      contactPhone: "202-555-0104",
      referringClinician: "Dr. Noor Malik",
      reason: "Knee pain x 6 months",
      notes: "Insurance card included",
    });
    expect(text).toBe(
      [
        "Patient: Taylor Diaz",
        "Contact: 202-555-0104",
        "Referring clinician: Dr. Noor Malik",
        "Reason for referral: Knee pain x 6 months",
        "Notes: Insurance card included",
      ].join("\n"),
    );
  });
});
