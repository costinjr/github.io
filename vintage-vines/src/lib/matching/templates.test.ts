import { describe, expect, it } from "vitest";
import { formatPriceCents } from "@/lib/format";
import { NO_INVENTORY_MESSAGE, explainMatch, explainNoCompatibleResult } from "./templates";
import { makeItem, makePreferences } from "./test-fixtures";

describe("NO_INVENTORY_MESSAGE", () => {
  it("matches the spec's exact copy, word for word", () => {
    expect(NO_INVENTORY_MESSAGE).toBe(
      "The potting bench is between batches. Tell Libby what you're looking for, or follow along for the next drop.",
    );
  });
});

describe("explainNoCompatibleResult", () => {
  it("names pet safety without inventing an item", () => {
    const message = explainNoCompatibleResult("pet safety");
    expect(message.toLowerCase()).toContain("pet");
  });

  it("names budget without inventing an item", () => {
    const message = explainNoCompatibleResult("budget");
    expect(message.toLowerCase()).toContain("budget");
  });
});

describe("explainMatch", () => {
  it("only states the real price, never a fabricated one", () => {
    const item = makeItem({ price_cents: 2500 });
    const explanation = explainMatch({ item, breakdown: { light: 0, careAndWatering: 0, size: 0, vesselStyle: 0, occasion: 0, featured: 0, total: 0, possibleMax: 0 } }, makePreferences());
    expect(explanation.reason).toContain(formatPriceCents(2500));
  });

  it("uses the item's own directional placement as the care note when one exists", () => {
    const item = makeItem({ directional_placement: "Keep it three feet from an east window." });
    const explanation = explainMatch(
      { item, breakdown: { light: 0, careAndWatering: 0, size: 0, vesselStyle: 0, occasion: 0, featured: 0, total: 0, possibleMax: 0 } },
      makePreferences(),
    );
    expect(explanation.careNote).toBe("Keep it three feet from an east window.");
  });

  it("keeps the headline within the 70-character contract Phase 7 will reuse", () => {
    const item = makeItem({ display_name: "A very long and unusually elaborate plant name indeed" });
    const explanation = explainMatch(
      { item, breakdown: { light: 0, careAndWatering: 0, size: 0, vesselStyle: 0, occasion: 0, featured: 0, total: 0, possibleMax: 0 } },
      makePreferences(),
    );
    expect(explanation.headline.length).toBeLessThanOrEqual(70);
  });
});
