import { describe, expect, it, vi } from "vitest";
import type { Referral } from "@/lib/types";
import type { TriagePipelineOutcome } from "@/lib/triage";

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: "NR-001",
    source: "paste",
    rawText: "STAT - same-day review needed.",
    receivedAt: "2026-01-01T00:00:00.000Z",
    serviceRequested: null,
    status: "New",
    priority: null,
    ownerRole: null,
    dueAt: null,
    completeness: null,
    missingFields: [],
    currentTriageRunId: null,
    isSynthetic: true,
    ...overrides,
  };
}

vi.mock("@/lib/referrals", () => ({
  getReferralById: vi.fn(),
}));

vi.mock("@/lib/triage", () => ({
  runTriagePipeline: vi.fn(),
}));

describe("POST /api/referrals/[id]/triage", () => {
  it("runs the pipeline for a real referral and returns its outcome", async () => {
    const { getReferralById } = await import("@/lib/referrals");
    const { runTriagePipeline } = await import("@/lib/triage");
    const referral = makeReferral();
    const pipelineOutcome: TriagePipelineOutcome = {
      status: "ok",
      triageRunId: "run-1",
      priority: "Critical",
      ruleHits: ['Critical: "STAT" matches an emergency escalation phrase.'],
    };
    vi.mocked(getReferralById).mockResolvedValue(referral);
    vi.mocked(runTriagePipeline).mockResolvedValue(pipelineOutcome);

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/referrals/NR-001/triage", { method: "POST" }), {
      params: Promise.resolve({ id: "NR-001" }),
    });

    expect(runTriagePipeline).toHaveBeenCalledWith(referral);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(pipelineOutcome);
  });

  it("returns 404 without running the pipeline when the referral doesn't exist", async () => {
    const { getReferralById } = await import("@/lib/referrals");
    const { runTriagePipeline } = await import("@/lib/triage");
    vi.mocked(getReferralById).mockResolvedValue(null);
    vi.mocked(runTriagePipeline).mockClear();

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/referrals/missing/triage", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    expect(runTriagePipeline).not.toHaveBeenCalled();
  });
});
