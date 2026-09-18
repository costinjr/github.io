import { describe, expect, it } from "vitest";
import type { ExtractionResult } from "./schema";
import { validateExtractionEvidence } from "./validate";

const rawText =
  "STAT - Dr. Elena Park requesting same-day review. Jordan Avery, 202-555-0101. Rapidly worsening facial swelling after recent procedure.";

function makeResult(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    requested_service: null,
    urgency_label_from_source: "STAT",
    urgency_clues: ["same-day review"],
    completeness: "incomplete",
    missing_fields: [],
    referring_clinician: "Dr. Elena Park",
    patient_contact_present: true,
    summary: "Same-day review requested after a recent procedure.",
    confidence: 0.9,
    evidence_quotes: [
      { field: "urgency_label_from_source", quote: "STAT" },
      { field: "referring_clinician", quote: "Dr. Elena Park" },
    ],
    contradictions: [],
    suggested_route: null,
    ...overrides,
  };
}

describe("validateExtractionEvidence", () => {
  it("accepts a result whose quotes genuinely appear in the source", () => {
    expect(validateExtractionEvidence(rawText, makeResult())).toEqual({ ok: true });
  });

  it("rejects an evidence quote that isn't actually in the source text", () => {
    const result = makeResult({
      evidence_quotes: [{ field: "urgency_label_from_source", quote: "URGENT" }],
    });
    const check = validateExtractionEvidence(rawText, result);
    expect(check.ok).toBe(false);
  });

  it("rejects a non-null conclusion with no supporting evidence quote", () => {
    const result = makeResult({
      referring_clinician: "Dr. Elena Park",
      evidence_quotes: [{ field: "urgency_label_from_source", quote: "STAT" }],
    });
    const check = validateExtractionEvidence(rawText, result);
    expect(check.ok).toBe(false);
  });

  it("rejects an urgency clue that is not a verbatim quote", () => {
    const result = makeResult({ urgency_clues: ["patient seems urgent"] });
    expect(validateExtractionEvidence(rawText, result).ok).toBe(false);
  });

  it("rejects a contradiction that is not a verbatim quote", () => {
    const result = makeResult({ contradictions: ["something that isn't in the text"] });
    expect(validateExtractionEvidence(rawText, result).ok).toBe(false);
  });

  it("tolerates whitespace differences when checking for a verbatim quote", () => {
    const result = makeResult({ urgency_clues: ["same-day   review"] });
    expect(validateExtractionEvidence(rawText, result).ok).toBe(true);
  });

  it("passes when every conclusion field is null and there are no evidence quotes", () => {
    const result = makeResult({
      urgency_label_from_source: null,
      referring_clinician: null,
      evidence_quotes: [],
      urgency_clues: [],
    });
    expect(validateExtractionEvidence(rawText, result)).toEqual({ ok: true });
  });
});
