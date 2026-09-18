import { describe, expect, it } from "vitest";
import { ExtractionResultSchema } from "./schema";

function validExtraction() {
  return {
    requested_service: "Cardiology",
    urgency_label_from_source: "STAT",
    urgency_clues: ["same-day review"],
    completeness: "complete",
    missing_fields: [],
    referring_clinician: "Dr. Elena Park",
    patient_contact_present: true,
    summary: "Same-day review requested after a recent procedure.",
    confidence: 0.9,
    evidence_quotes: [
      { field: "requested_service", quote: "cardiology consult" },
      { field: "urgency_label_from_source", quote: "STAT" },
    ],
    contradictions: [],
    suggested_route: "Cardiology",
  };
}

describe("ExtractionResultSchema", () => {
  it("accepts a well-formed extraction", () => {
    expect(ExtractionResultSchema.safeParse(validExtraction()).success).toBe(true);
  });

  it("allows null for every conclusion field", () => {
    const result = ExtractionResultSchema.safeParse({
      ...validExtraction(),
      requested_service: null,
      urgency_label_from_source: null,
      referring_clinician: null,
      suggested_route: null,
      evidence_quotes: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a service outside the known list", () => {
    const result = ExtractionResultSchema.safeParse({ ...validExtraction(), requested_service: "Podiatry" });
    expect(result.success).toBe(false);
  });

  it("rejects confidence outside 0-1", () => {
    expect(ExtractionResultSchema.safeParse({ ...validExtraction(), confidence: 1.5 }).success).toBe(false);
    expect(ExtractionResultSchema.safeParse({ ...validExtraction(), confidence: -0.1 }).success).toBe(false);
  });

  it("rejects a completeness value outside the enum", () => {
    expect(ExtractionResultSchema.safeParse({ ...validExtraction(), completeness: "mostly" }).success).toBe(false);
  });

  it("rejects an evidence quote field name outside the evidence-backed set", () => {
    const result = ExtractionResultSchema.safeParse({
      ...validExtraction(),
      evidence_quotes: [{ field: "summary", quote: "anything" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const withoutSummary: Record<string, unknown> = validExtraction();
    delete withoutSummary.summary;
    expect(ExtractionResultSchema.safeParse(withoutSummary).success).toBe(false);
  });
});
