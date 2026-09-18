import { describe, expect, it } from "vitest";
import type { ExtractionResult } from "@/lib/extraction/schema";
import { applyTriageRules, TRIAGE_RULES_VERSION } from "./triage-rules.v1";

function makeExtraction(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    requested_service: "Cardiology",
    urgency_label_from_source: null,
    urgency_clues: [],
    completeness: "complete",
    missing_fields: [],
    referring_clinician: "Dr. Sam Reed",
    patient_contact_present: true,
    summary: "Routine cardiology consult.",
    confidence: 0.9,
    evidence_quotes: [{ field: "requested_service", quote: "cardiology consult" }],
    contradictions: [],
    suggested_route: "Cardiology",
    ...overrides,
  };
}

// A Monday, comfortably inside business hours.
const MONDAY = "2026-01-05T10:00:00.000Z";
// A Friday, to test business-day-skipping math.
const FRIDAY = "2026-01-09T10:00:00.000Z";

describe("applyTriageRules — Critical", () => {
  it("fires on an emergency escalation phrase in the urgency label", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ urgency_label_from_source: "STAT" }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Critical");
    expect(outcome.ownerRole).toBe("Triage Lead");
    expect(outcome.ruleHits[0]).toContain("STAT");
  });

  it("fires on an emergency escalation phrase in an urgency clue", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ urgency_clues: ["directed same-day review"] }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Critical");
  });

  it("sets due time to the moment the referral was received (immediate review)", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ urgency_label_from_source: "STAT" }), receivedAt: MONDAY });
    expect(outcome.dueAt).toBe(new Date(MONDAY).toISOString());
  });
});

describe("applyTriageRules — Today", () => {
  it("fires on 'urgent' in the urgency label", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ urgency_label_from_source: "urgent" }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Today");
    expect(outcome.ownerRole).toBe("Triage Nurse");
  });

  it("fires on suspected malignancy in an urgency clue", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ urgency_clues: ["Suspected malignancy based on abnormal imaging"] }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Today");
  });

  it("fires on a postoperative concern", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ urgency_clues: ["post-op patient"] }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Today");
  });

  it("sets due time to the end of the current business day", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ urgency_label_from_source: "urgent" }), receivedAt: MONDAY });
    expect(outcome.dueAt).toBe("2026-01-05T17:00:00.000Z");
  });
});

describe("applyTriageRules — Manual Review", () => {
  it("fires on conflicting urgency cues", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ contradictions: ["routine follow-up", "review today for drainage concern"] }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Manual Review");
    expect(outcome.ownerRole).toBe("Triage Lead");
  });

  it("fires on a suggested route the clinic doesn't offer", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ suggested_route: "Podiatry" }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Manual Review");
  });

  it("fires on confidence below the configured threshold", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ confidence: 0.3 }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Manual Review");
    expect(outcome.ruleHits[0]).toContain("0.3");
  });

  it("does not fire on confidence right at the threshold", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ confidence: 0.6 }), receivedAt: MONDAY });
    expect(outcome.priority).not.toBe("Manual Review");
  });
});

describe("applyTriageRules — Needs Information", () => {
  it("fires when a required field is missing", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ missing_fields: ["patient_contact"] }), receivedAt: MONDAY });
    expect(outcome.priority).toBe("Needs Information");
    expect(outcome.ownerRole).toBe("Intake");
  });

  it("does not fire for a missing field outside the required set", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ missing_fields: ["insurance_card"] }), receivedAt: MONDAY });
    expect(outcome.priority).not.toBe("Needs Information");
  });

  it("sets due time to one business day out", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ missing_fields: ["referring_clinician"] }), receivedAt: MONDAY });
    expect(outcome.dueAt).toBe("2026-01-06T17:00:00.000Z");
  });

  it("skips the weekend when one business day out from a Friday", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction({ missing_fields: ["referring_clinician"] }), receivedAt: FRIDAY });
    expect(outcome.dueAt).toBe("2026-01-12T17:00:00.000Z"); // the following Monday
  });
});

describe("applyTriageRules — This Week", () => {
  it("is the default for a complete, unremarkable referral", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction(), receivedAt: MONDAY });
    expect(outcome.priority).toBe("This Week");
    expect(outcome.ownerRole).toBe("Scheduling");
  });

  it("sets due time to two business days out", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction(), receivedAt: MONDAY });
    expect(outcome.dueAt).toBe("2026-01-07T17:00:00.000Z");
  });

  it("skips the weekend when two business days out from a Friday", () => {
    const outcome = applyTriageRules({ extraction: makeExtraction(), receivedAt: FRIDAY });
    expect(outcome.dueAt).toBe("2026-01-13T17:00:00.000Z"); // the following Tuesday
  });
});

describe("applyTriageRules — precedence", () => {
  it("Critical wins over Needs Information, but both are recorded in ruleHits", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ urgency_label_from_source: "STAT", missing_fields: ["patient_contact"] }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Critical");
    expect(outcome.ruleHits).toHaveLength(2);
    expect(outcome.ruleHits.some((hit) => hit.startsWith("Critical"))).toBe(true);
    expect(outcome.ruleHits.some((hit) => hit.startsWith("Needs Information"))).toBe(true);
  });

  it("Today wins over Manual Review", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ urgency_label_from_source: "urgent", confidence: 0.3 }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Today");
  });

  it("Manual Review wins over Needs Information", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({ confidence: 0.3, missing_fields: ["patient_contact"] }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Manual Review");
  });

  it("full precedence chain: Critical still wins when every other category also matches", () => {
    const outcome = applyTriageRules({
      extraction: makeExtraction({
        urgency_label_from_source: "STAT",
        contradictions: ["a", "b"],
        confidence: 0.1,
        missing_fields: ["patient_contact"],
      }),
      receivedAt: MONDAY,
    });
    expect(outcome.priority).toBe("Critical");
    // One hit per matching category (Critical, Manual Review, Needs Information) —
    // Manual Review reports its first-matching reason (contradictions), not
    // every sub-condition within that one category.
    expect(outcome.ruleHits).toHaveLength(3);
  });
});

it("exports a stable rules version", () => {
  expect(TRIAGE_RULES_VERSION).toBe("v1");
});
