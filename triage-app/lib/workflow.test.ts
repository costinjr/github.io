import { beforeEach, describe, expect, it } from "vitest";
import type { QueryExecutor } from "./db";
import { createReferral } from "./referrals";
import { createTestDb } from "./test-support/pg-mem-db";
import { addWorkflowNote, changeReferralStatus, describeWorkflowEvent, listWorkflowEvents } from "./workflow";
import type { WorkflowEvent } from "./types";

describe("changeReferralStatus", () => {
  let db: QueryExecutor;
  let referralId: string;

  beforeEach(async () => {
    db = createTestDb();
    const referral = await createReferral({ source: "paste", rawText: "Some referral text." }, db);
    referralId = referral.id;
  });

  it("updates the referral's status", async () => {
    await changeReferralStatus(referralId, "New", "Needs Information", db);
    const { rows } = await db.query<{ status: string }>("select status from referrals where id = $1", [referralId]);
    expect(rows[0]?.status).toBe("Needs Information");
  });

  it("records a status_change workflow event with the from/to values", async () => {
    await changeReferralStatus(referralId, "New", "Ready to Schedule", db);
    const events = await listWorkflowEvents(referralId, db);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: "status_change",
      fromValue: "New",
      toValue: "Ready to Schedule",
      note: null,
    });
  });

  it("keeps a full audit trail across multiple changes, oldest first", async () => {
    await changeReferralStatus(referralId, "New", "Needs Information", db);
    await changeReferralStatus(referralId, "Needs Information", "Ready to Schedule", db);

    const events = await listWorkflowEvents(referralId, db);
    expect(events.map((e) => e.toValue)).toEqual(["Needs Information", "Ready to Schedule"]);
  });
});

describe("addWorkflowNote", () => {
  let db: QueryExecutor;
  let referralId: string;

  beforeEach(async () => {
    db = createTestDb();
    const referral = await createReferral({ source: "paste", rawText: "Some referral text." }, db);
    referralId = referral.id;
  });

  it("records a note event without touching status", async () => {
    await addWorkflowNote(referralId, "Called the office, left a voicemail.", db);
    const events = await listWorkflowEvents(referralId, db);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventType: "note",
      note: "Called the office, left a voicemail.",
      fromValue: null,
      toValue: null,
    });

    const { rows } = await db.query<{ status: string }>("select status from referrals where id = $1", [referralId]);
    expect(rows[0]?.status).toBe("New");
  });

  it("interleaves with status changes in creation order", async () => {
    await addWorkflowNote(referralId, "First note.", db);
    await changeReferralStatus(referralId, "New", "Needs Information", db);
    await addWorkflowNote(referralId, "Second note.", db);

    const events = await listWorkflowEvents(referralId, db);
    expect(events.map((e) => e.eventType)).toEqual(["note", "status_change", "note"]);
  });
});

function makeEvent(overrides: Partial<WorkflowEvent>): WorkflowEvent {
  return {
    id: "evt-1",
    referralId: "ref-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    eventType: "note",
    fromValue: null,
    toValue: null,
    note: null,
    ...overrides,
  };
}

describe("describeWorkflowEvent", () => {
  it("describes a status change with both values", () => {
    const text = describeWorkflowEvent(
      makeEvent({ eventType: "status_change", fromValue: "New", toValue: "Needs Information" }),
    );
    expect(text).toBe("Status changed from New to Needs Information.");
  });

  it("describes a note with its text", () => {
    const text = describeWorkflowEvent(makeEvent({ eventType: "note", note: "Called the office." }));
    expect(text).toBe("Note: Called the office.");
  });
});
