import { describe, expect, it, vi } from "vitest";
import type { Referral } from "@/lib/types";

const rawText = "STAT - Dr. Elena Park requesting same-day review. Facial swelling after recent procedure.";

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: "NR-001",
    source: "paste",
    rawText,
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

const validParsedOutput = {
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

vi.mock("@/lib/referrals", () => ({
  getReferralById: vi.fn(),
}));

vi.mock("@/lib/anthropic-client", () => ({
  getAnthropicClient: vi.fn(),
}));

describe("POST /api/referrals/[id]/triage", () => {
  it("returns a valid extraction record with evidence for a real referral", async () => {
    const { getReferralById } = await import("@/lib/referrals");
    const { getAnthropicClient } = await import("@/lib/anthropic-client");
    vi.mocked(getReferralById).mockResolvedValue(makeReferral());
    vi.mocked(getAnthropicClient).mockReturnValue({
      messages: { parse: vi.fn().mockResolvedValue({ parsed_output: validParsedOutput }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/referrals/NR-001/triage", { method: "POST" }), {
      params: Promise.resolve({ id: "NR-001" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.result.evidence_quotes.length).toBeGreaterThan(0);
    expect(body.model).toBe("claude-opus-5");
    expect(body.promptVersion).toBe("v1");
  });

  it("returns 404 when the referral doesn't exist", async () => {
    const { getReferralById } = await import("@/lib/referrals");
    vi.mocked(getReferralById).mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/referrals/missing/triage", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns needs_review when the model never produces verifiable evidence", async () => {
    const { getReferralById } = await import("@/lib/referrals");
    const { getAnthropicClient } = await import("@/lib/anthropic-client");
    vi.mocked(getReferralById).mockResolvedValue(makeReferral());
    vi.mocked(getAnthropicClient).mockReturnValue({
      messages: { parse: vi.fn().mockResolvedValue({ parsed_output: null }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost/api/referrals/NR-001/triage", { method: "POST" }), {
      params: Promise.resolve({ id: "NR-001" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("needs_review");
  });
});
