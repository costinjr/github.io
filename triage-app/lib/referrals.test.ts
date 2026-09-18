import { beforeEach, describe, expect, it } from "vitest";
import type { QueryExecutor } from "./db";
import { createReferral, getReferralById, listReferrals } from "./referrals";
import { createTestDb } from "./test-support/pg-mem-db";

describe("createReferral", () => {
  let db: QueryExecutor;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates a New, synthetic referral with the given source and text", async () => {
    const referral = await createReferral({ source: "paste", rawText: "STAT review needed." }, db);

    expect(referral.status).toBe("New");
    expect(referral.isSynthetic).toBe(true);
    expect(referral.source).toBe("paste");
    expect(referral.rawText).toBe("STAT review needed.");
    expect(referral.priority).toBeNull();
    expect(referral.missingFields).toEqual([]);
  });

  it("generates a unique id for each referral", async () => {
    const a = await createReferral({ source: "paste", rawText: "First referral." }, db);
    const b = await createReferral({ source: "form", rawText: "Second referral." }, db);
    expect(a.id).not.toBe(b.id);
  });

  it("is retrievable by id afterwards", async () => {
    const created = await createReferral({ source: "form", rawText: "Structured intake text." }, db);
    const fetched = await getReferralById(created.id, db);
    expect(fetched).toEqual(created);
  });

  it("appears in listReferrals", async () => {
    await createReferral({ source: "paste", rawText: "Referral one." }, db);
    await createReferral({ source: "paste", rawText: "Referral two." }, db);
    expect(await listReferrals(db)).toHaveLength(2);
  });
});

describe("getReferralById", () => {
  it("returns null for an id that doesn't exist", async () => {
    const db = createTestDb();
    expect(await getReferralById("does-not-exist", db)).toBeNull();
  });
});
