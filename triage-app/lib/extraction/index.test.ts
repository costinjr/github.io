import { describe, expect, it } from "vitest";
import { runExtraction } from "./index";
import type { ModelCaller } from "./index";
import type { ExtractionResult } from "./schema";

const rawText = "STAT - Dr. Elena Park requesting same-day review. Facial swelling after recent procedure.";

function validResult(): ExtractionResult {
  return {
    requested_service: null,
    urgency_label_from_source: "STAT",
    urgency_clues: ["same-day review"],
    completeness: "incomplete",
    missing_fields: ["patient_contact"],
    referring_clinician: "Dr. Elena Park",
    patient_contact_present: false,
    summary: "Same-day review requested after a recent procedure.",
    confidence: 0.92,
    evidence_quotes: [
      { field: "urgency_label_from_source", quote: "STAT" },
      { field: "referring_clinician", quote: "Dr. Elena Park" },
    ],
    contradictions: [],
    suggested_route: null,
  };
}

function fakeCaller(...responses: (ExtractionResult | null)[]): ModelCaller & { callCount: number } {
  let callCount = 0;
  return {
    get callCount() {
      return callCount;
    },
    async extract() {
      const response = responses[callCount] ?? null;
      callCount += 1;
      return response;
    },
  };
}

describe("runExtraction", () => {
  it("returns a valid extraction record with evidence on the first try", async () => {
    const caller = fakeCaller(validResult());
    const outcome = await runExtraction(rawText, caller);

    expect(outcome.status).toBe("ok");
    if (outcome.status === "ok") {
      expect(outcome.result.evidence_quotes.length).toBeGreaterThan(0);
      expect(outcome.model).toBe("claude-opus-5");
      expect(outcome.promptVersion).toBe("v1");
    }
    expect(caller.callCount).toBe(1);
  });

  it("retries once when the model returns null (invalid structure), then succeeds", async () => {
    const caller = fakeCaller(null, validResult());
    const outcome = await runExtraction(rawText, caller);

    expect(outcome.status).toBe("ok");
    expect(caller.callCount).toBe(2);
  });

  it("retries once when the evidence fails verification, then succeeds", async () => {
    const badResult = { ...validResult(), evidence_quotes: [{ field: "urgency_label_from_source" as const, quote: "not in the text" }] };
    const caller = fakeCaller(badResult, validResult());
    const outcome = await runExtraction(rawText, caller);

    expect(outcome.status).toBe("ok");
    expect(caller.callCount).toBe(2);
  });

  it("returns needs_review after two invalid-structure failures, without retrying a third time", async () => {
    const caller = fakeCaller(null, null);
    const outcome = await runExtraction(rawText, caller);

    expect(outcome.status).toBe("needs_review");
    expect(caller.callCount).toBe(2);
  });

  it("returns needs_review after two evidence-verification failures", async () => {
    const badResult = { ...validResult(), referring_clinician: "Someone not quoted", evidence_quotes: [] };
    const caller = fakeCaller(badResult, badResult);
    const outcome = await runExtraction(rawText, caller);

    expect(outcome.status).toBe("needs_review");
    if (outcome.status === "needs_review") {
      expect(outcome.reason.length).toBeGreaterThan(0);
    }
  });
});
