import { describe, expect, it } from "vitest";
import {
  bandForReferral,
  distinctServices,
  filterReferrals,
  formatAge,
  groupByBand,
  parseQueueFilters,
  reasonForReferral,
  sortForQueue,
} from "./queue";
import type { Referral } from "./types";

function makeReferral(overrides: Partial<Referral>): Referral {
  return {
    id: "NR-000",
    source: "paste",
    rawText: "raw text",
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

describe("bandForReferral", () => {
  it("puts closed and declined statuses in the Closed band regardless of priority", () => {
    expect(bandForReferral(makeReferral({ status: "Closed", priority: "Critical" }))).toBe("Closed");
    expect(bandForReferral(makeReferral({ status: "Declined" }))).toBe("Closed");
  });

  it("uses the priority as the band when set", () => {
    expect(bandForReferral(makeReferral({ priority: "Today" }))).toBe("Today");
  });

  it("falls back to Unclassified when no priority has been assigned yet", () => {
    expect(bandForReferral(makeReferral({ priority: null, status: "New" }))).toBe("Unclassified");
  });
});

describe("reasonForReferral", () => {
  it("explains why an item hasn't been triaged yet", () => {
    expect(reasonForReferral(makeReferral({ priority: null }))).toBe("Awaiting triage.");
  });

  it("names the assigned priority once triage has run", () => {
    expect(reasonForReferral(makeReferral({ priority: "Critical" }))).toContain("Critical");
  });

  it("explains a declined referral separately from a closed one", () => {
    expect(reasonForReferral(makeReferral({ status: "Declined" }))).toMatch(/declined/i);
    expect(reasonForReferral(makeReferral({ status: "Closed" }))).toBe("Closed.");
  });
});

describe("sortForQueue", () => {
  it("orders bands Critical, Today, Manual Review, Needs Information, This Week, Unclassified, then Closed", () => {
    const referrals = [
      makeReferral({ id: "closed", status: "Closed" }),
      makeReferral({ id: "unclassified", priority: null }),
      makeReferral({ id: "this-week", priority: "This Week" }),
      makeReferral({ id: "critical", priority: "Critical" }),
      makeReferral({ id: "needs-info", priority: "Needs Information" }),
      makeReferral({ id: "today", priority: "Today" }),
      makeReferral({ id: "manual-review", priority: "Manual Review" }),
    ];

    const sorted = sortForQueue(referrals).map((r) => r.id);
    expect(sorted).toEqual([
      "critical",
      "today",
      "manual-review",
      "needs-info",
      "this-week",
      "unclassified",
      "closed",
    ]);
  });

  it("within a band, sorts by due date ascending with nulls last", () => {
    const referrals = [
      makeReferral({ id: "no-due", priority: "Today", dueAt: null }),
      makeReferral({ id: "later", priority: "Today", dueAt: "2026-01-02T00:00:00.000Z" }),
      makeReferral({ id: "sooner", priority: "Today", dueAt: "2026-01-01T00:00:00.000Z" }),
    ];

    const sorted = sortForQueue(referrals).map((r) => r.id);
    expect(sorted).toEqual(["sooner", "later", "no-due"]);
  });

  it("breaks ties on received_at, oldest first", () => {
    const referrals = [
      makeReferral({ id: "newer", priority: "Today", receivedAt: "2026-01-02T00:00:00.000Z" }),
      makeReferral({ id: "older", priority: "Today", receivedAt: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(sortForQueue(referrals).map((r) => r.id)).toEqual(["older", "newer"]);
  });
});

describe("groupByBand", () => {
  it("returns every band, including empty ones", () => {
    const groups = groupByBand([makeReferral({ priority: "Critical" })]);
    expect(Object.keys(groups)).toEqual([
      "Critical",
      "Today",
      "Manual Review",
      "Needs Information",
      "This Week",
      "Unclassified",
      "Closed",
    ]);
    expect(groups.Critical).toHaveLength(1);
    expect(groups.Today).toHaveLength(0);
  });
});

describe("filterReferrals", () => {
  const referrals = [
    makeReferral({ id: "a", status: "New", priority: "Critical", ownerRole: "Triage Lead", serviceRequested: "Cardiology" }),
    makeReferral({ id: "b", status: "Needs Information", priority: null, ownerRole: "Intake", serviceRequested: null }),
  ];

  it("filters by status", () => {
    expect(filterReferrals(referrals, { status: "New" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("filters by priority", () => {
    expect(filterReferrals(referrals, { priority: "Critical" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("filters by service", () => {
    expect(filterReferrals(referrals, { service: "Cardiology" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("filters by owner role", () => {
    expect(filterReferrals(referrals, { ownerRole: "Intake" }).map((r) => r.id)).toEqual(["b"]);
  });

  it("combines filters with AND semantics", () => {
    expect(filterReferrals(referrals, { status: "New", ownerRole: "Intake" })).toHaveLength(0);
  });

  it("returns everything when no filters are given", () => {
    expect(filterReferrals(referrals, {})).toHaveLength(2);
  });
});

describe("distinctServices", () => {
  it("returns sorted, de-duplicated, non-null services", () => {
    const referrals = [
      makeReferral({ serviceRequested: "Cardiology" }),
      makeReferral({ serviceRequested: null }),
      makeReferral({ serviceRequested: "Dermatology" }),
      makeReferral({ serviceRequested: "Cardiology" }),
    ];
    expect(distinctServices(referrals)).toEqual(["Cardiology", "Dermatology"]);
  });
});

describe("parseQueueFilters", () => {
  it("accepts known enum values", () => {
    expect(parseQueueFilters({ status: "New", priority: "Critical", ownerRole: "Intake" })).toEqual({
      status: "New",
      priority: "Critical",
      ownerRole: "Intake",
    });
  });

  it("passes through an arbitrary service value", () => {
    expect(parseQueueFilters({ service: "Cardiology" })).toEqual({ service: "Cardiology" });
  });

  it("drops unknown or invalid enum values instead of throwing", () => {
    expect(parseQueueFilters({ status: "Not A Real Status", priority: "" })).toEqual({});
  });

  it("takes the first value when a param repeats", () => {
    expect(parseQueueFilters({ status: ["New", "Closed"] })).toEqual({ status: "New" });
  });

  it("returns an empty object for no params", () => {
    expect(parseQueueFilters({})).toEqual({});
  });
});

describe("formatAge", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime();

  it("shows 'just now' for very recent items", () => {
    expect(formatAge("2026-01-01T11:59:45.000Z", now)).toBe("just now");
  });

  it("shows minutes for items under an hour old", () => {
    expect(formatAge("2026-01-01T11:30:00.000Z", now)).toBe("30m ago");
  });

  it("shows hours for items under a day old", () => {
    expect(formatAge("2026-01-01T06:00:00.000Z", now)).toBe("6h ago");
  });

  it("shows days for older items", () => {
    expect(formatAge("2025-12-30T12:00:00.000Z", now)).toBe("2d ago");
  });
});
