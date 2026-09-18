import { beforeEach, describe, expect, it } from "vitest";
import type { ExtractionResult } from "./extraction/schema";
import type { ModelCaller } from "./extraction";
import { createReferral, getReferralById } from "./referrals";
import { createTestDb } from "./test-support/pg-mem-db";
import { runTriagePipeline } from "./triage";
import { listTriageRuns } from "./triage-runs";
import type { QueryExecutor } from "./db";
import type { Referral } from "./types";

const STAT_TEXT =
  "STAT - Dr. Elena Park requesting same-day review. Jordan Avery, 202-555-0101. Rapidly worsening facial swelling.";

function validExtraction(overrides: Partial<ExtractionResult> = {}): ExtractionResult {
  return {
    requested_service: null,
    urgency_label_from_source: "STAT",
    urgency_clues: ["same-day review"],
    completeness: "incomplete",
    missing_fields: ["patient_contact"],
    referring_clinician: "Dr. Elena Park",
    patient_contact_present: false,
    summary: "Same-day review requested after facial swelling.",
    confidence: 0.95,
    evidence_quotes: [
      { field: "urgency_label_from_source", quote: "STAT" },
      { field: "referring_clinician", quote: "Dr. Elena Park" },
    ],
    contradictions: [],
    suggested_route: null,
    ...overrides,
  };
}

function fakeCaller(...responses: (ExtractionResult | null)[]): ModelCaller {
  let callCount = 0;
  return {
    async extract() {
      const response = responses[callCount] ?? null;
      callCount += 1;
      return response;
    },
  };
}

describe("runTriagePipeline", () => {
  let db: QueryExecutor;
  let referral: Referral;

  beforeEach(async () => {
    db = createTestDb();
    referral = await createReferral({ source: "paste", rawText: STAT_TEXT }, db);
  });

  it("lands the STAT example in Critical with exact evidence and a visible rule hit", async () => {
    const outcome = await runTriagePipeline(referral, db, fakeCaller(validExtraction()));

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.priority).toBe("Critical");
    expect(outcome.ruleHits.some((hit) => hit.includes("STAT"))).toBe(true);

    const updated = await getReferralById(referral.id, db);
    expect(updated?.priority).toBe("Critical");
    expect(updated?.ownerRole).toBe("Triage Lead");
    expect(updated?.currentTriageRunId).toBe(outcome.triageRunId);

    const runs = await listTriageRuns(referral.id, db);
    expect(runs).toHaveLength(1);
    expect(runs[0].finalPriority).toBe("Critical");
    expect(runs[0].rulesVersion).toBe("v1");
    // evidence_json round-trips through jsonb intact
    expect(runs[0].evidenceJson).toEqual(validExtraction().evidence_quotes);
  });

  it("does not touch the referral's own facts on a needs_review outcome", async () => {
    const outcome = await runTriagePipeline(referral, db, fakeCaller(null, null));

    expect(outcome.status).toBe("needs_review");
    const updated = await getReferralById(referral.id, db);
    expect(updated?.priority).toBeNull();
    expect(updated?.completeness).toBeNull();
    // The failed attempt is still findable from the referral.
    expect(updated?.currentTriageRunId).toBeTruthy();

    const runs = await listTriageRuns(referral.id, db);
    expect(runs).toHaveLength(1);
    expect(runs[0].finalPriority).toBeNull();
  });

  it("creates a new immutable run on each call rather than overwriting the last one", async () => {
    await runTriagePipeline(referral, db, fakeCaller(validExtraction()));
    const secondOutcome = await runTriagePipeline(
      referral,
      db,
      fakeCaller(validExtraction({ urgency_label_from_source: null, urgency_clues: [], confidence: 0.9 })),
    );

    const runs = await listTriageRuns(referral.id, db);
    expect(runs).toHaveLength(2);

    const updated = await getReferralById(referral.id, db);
    expect(updated?.currentTriageRunId).toBe(secondOutcome.status === "ok" ? secondOutcome.triageRunId : undefined);
  });
});
