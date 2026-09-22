import { describe, expect, it } from "vitest";
import { matchInventory } from "./match";
import { makeItem, makePreferences } from "./test-fixtures";

describe("matchInventory", () => {
  it("reports no_inventory when there is nothing to match against, without scoring anything", () => {
    expect(matchInventory([], makePreferences())).toEqual({ kind: "no_inventory" });
  });

  it("never returns a toxic or unknown-safety item when pet safety is required", () => {
    const toxic = makeItem({ pet_safety: "toxic" });
    const unknown = makeItem({ pet_safety: "unknown" });
    const outcome = matchInventory([toxic, unknown], makePreferences({ petSafetyRequired: true }));
    expect(outcome.kind).toBe("no_compatible_result");
  });

  it("names pet safety as the limiting reason when that's what blocked every candidate", () => {
    const toxic = makeItem({ pet_safety: "toxic" });
    const outcome = matchInventory([toxic], makePreferences({ petSafetyRequired: true }));
    expect(outcome).toEqual({ kind: "no_compatible_result", limitingReason: "pet safety" });
  });

  it("never exceeds an explicit budget, even as a fallback", () => {
    const overBudget = makeItem({ price_cents: 5000 });
    const outcome = matchInventory([overBudget], makePreferences({ budgetMax: 2000 }));
    expect(outcome.kind).toBe("no_compatible_result");
  });

  it("returns a real match when a candidate satisfies every hard constraint", () => {
    const item = makeItem({ light_levels: ["low"], pet_safety: "pet_safe", price_cents: 1500 });
    const outcome = matchInventory(
      [item],
      makePreferences({ light: "low", petSafetyRequired: true, budgetMax: 2000 }),
    );
    expect(outcome.kind).toBe("matched");
    if (outcome.kind === "matched" || outcome.kind === "closest_safe") {
      expect(outcome.selected.item.id).toBe(item.id);
    }
  });

  it("falls back to the closest safe option, named, when only light doesn't match — never relaxing pet safety in the process", () => {
    const wrongLightButSafe = makeItem({
      light_levels: ["high"],
      pet_safety: "pet_safe",
    });
    const rightLightButUnsafe = makeItem({
      light_levels: ["low"],
      pet_safety: "toxic",
    });
    const outcome = matchInventory(
      [wrongLightButSafe, rightLightButUnsafe],
      makePreferences({ light: "low", petSafetyRequired: true }),
    );
    expect(outcome.kind).toBe("closest_safe");
    if (outcome.kind === "closest_safe") {
      expect(outcome.selected.item.id).toBe(wrongLightButSafe.id);
      expect(outcome.constraintNotes.length).toBeGreaterThan(0);
      expect(outcome.constraintNotes[0]).toContain("low");
    }
  });

  it("only ever selects from the given candidate set", () => {
    const items = [makeItem(), makeItem(), makeItem()];
    const outcome = matchInventory(items, makePreferences());
    expect(outcome.kind).toBe("matched");
    if (outcome.kind === "matched") {
      const ids = items.map((i) => i.id);
      expect(ids).toContain(outcome.selected.item.id);
      for (const alt of outcome.alternates) {
        expect(ids).toContain(alt.item.id);
      }
    }
  });

  it("returns at most two alternates", () => {
    const items = [makeItem(), makeItem(), makeItem(), makeItem(), makeItem()];
    const outcome = matchInventory(items, makePreferences());
    if (outcome.kind === "matched" || outcome.kind === "closest_safe") {
      expect(outcome.alternates.length).toBeLessThanOrEqual(2);
    }
  });

  it("never duplicates the selected item into the alternates", () => {
    const items = [makeItem(), makeItem(), makeItem()];
    const outcome = matchInventory(items, makePreferences());
    if (outcome.kind === "matched") {
      const altIds = outcome.alternates.map((a) => a.item.id);
      expect(altIds).not.toContain(outcome.selected.item.id);
    }
  });
});
