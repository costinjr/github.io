import { describe, expect, it } from "vitest";
import { applyLightFilter, applyNonNegotiableFilters } from "./filters";
import { makeItem, makePreferences } from "./test-fixtures";

describe("applyNonNegotiableFilters", () => {
  it("excludes toxic items when pet safety is required", () => {
    const petSafe = makeItem({ pet_safety: "pet_safe" });
    const toxic = makeItem({ pet_safety: "toxic" });
    const result = applyNonNegotiableFilters(
      [petSafe, toxic],
      makePreferences({ petSafetyRequired: true }),
    );
    expect(result).toEqual([petSafe]);
  });

  it("excludes unknown pet-safety items when pet safety is required — unknown is never treated as safe", () => {
    const unknown = makeItem({ pet_safety: "unknown" });
    const result = applyNonNegotiableFilters([unknown], makePreferences({ petSafetyRequired: true }));
    expect(result).toEqual([]);
  });

  it("does not filter on pet safety when not required", () => {
    const toxic = makeItem({ pet_safety: "toxic" });
    const result = applyNonNegotiableFilters([toxic], makePreferences({ petSafetyRequired: false }));
    expect(result).toEqual([toxic]);
  });

  it("excludes items over an explicit budget", () => {
    const cheap = makeItem({ price_cents: 1000 });
    const expensive = makeItem({ price_cents: 5000 });
    const result = applyNonNegotiableFilters(
      [cheap, expensive],
      makePreferences({ budgetMax: 2000 }),
    );
    expect(result).toEqual([cheap]);
  });

  it("never exceeds an explicit budget even at the boundary", () => {
    const atBudget = makeItem({ price_cents: 2000 });
    const overBudget = makeItem({ price_cents: 2001 });
    const result = applyNonNegotiableFilters(
      [atBudget, overBudget],
      makePreferences({ budgetMax: 2000 }),
    );
    expect(result).toEqual([atBudget]);
  });

  it("does not filter on price when no budget was stated", () => {
    const expensive = makeItem({ price_cents: 5000 });
    const result = applyNonNegotiableFilters([expensive], makePreferences({ budgetMax: null }));
    expect(result).toEqual([expensive]);
  });
});

describe("applyLightFilter", () => {
  it("never returns a high-light-only item for a low-light request", () => {
    const highOnly = makeItem({ light_levels: ["high"] });
    const lowMedium = makeItem({ light_levels: ["low", "medium"] });
    const result = applyLightFilter([highOnly, lowMedium], makePreferences({ light: "low" }));
    expect(result).toEqual([lowMedium]);
  });

  it("passes through everything when light is unspecified", () => {
    const items = [makeItem({ light_levels: ["high"] }), makeItem({ light_levels: ["low"] })];
    const result = applyLightFilter(items, makePreferences({ light: "unknown" }));
    expect(result).toEqual(items);
  });
});
