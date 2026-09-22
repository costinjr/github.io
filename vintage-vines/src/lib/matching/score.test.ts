import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS } from "./config";
import { mapSizePreferenceToSizeClass, scoreItem } from "./score";
import { makeItem, makePreferences } from "./test-fixtures";

describe("mapSizePreferenceToSizeClass", () => {
  it("maps the preference vocabulary onto the inventory size_class enum", () => {
    expect(mapSizePreferenceToSizeClass("small")).toBe("small");
    expect(mapSizePreferenceToSizeClass("medium")).toBe("standard");
    expect(mapSizePreferenceToSizeClass("large")).toBe("large");
    expect(mapSizePreferenceToSizeClass("unknown")).toBeNull();
  });
});

describe("scoreItem", () => {
  it("awards nothing and requires nothing when every preference is unknown", () => {
    const item = makeItem();
    const breakdown = scoreItem(item, makePreferences());
    expect(breakdown.total).toBe(0);
    // featured is always in play regardless of what was asked
    expect(breakdown.possibleMax).toBe(MATCH_WEIGHTS.featured);
  });

  it("gives full light marks to any item once light is specified (the hard filter already did the real gating)", () => {
    const item = makeItem({ light_levels: ["low"] });
    const breakdown = scoreItem(item, makePreferences({ light: "low" }));
    expect(breakdown.light).toBe(MATCH_WEIGHTS.light);
  });

  it("never calls an involved plant easy — an easy request against an involved plant scores the minimum, not a false match", () => {
    const involved = makeItem({ care_difficulty: "involved" });
    const breakdown = scoreItem(involved, makePreferences({ careTolerance: "easy" }));
    expect(breakdown.careAndWatering).toBe(0);
  });

  it("gives partial credit for an adjacent care level", () => {
    const moderate = makeItem({ care_difficulty: "moderate" });
    const breakdown = scoreItem(moderate, makePreferences({ careTolerance: "easy" }));
    expect(breakdown.careAndWatering).toBeGreaterThan(0);
    expect(breakdown.careAndWatering).toBeLessThan(MATCH_WEIGHTS.careAndWatering / 2);
  });

  it("scores an exact watering match at full marks for that half of the line", () => {
    const item = makeItem({ watering: "regular" });
    const breakdown = scoreItem(item, makePreferences({ watering: "regular" }));
    expect(breakdown.careAndWatering).toBe(MATCH_WEIGHTS.careAndWatering / 2);
  });

  it("scores vessel style as all-or-nothing, not partial", () => {
    const matching = makeItem({ vessel_style_tags: ["brass", "minimal"] });
    const notMatching = makeItem({ vessel_style_tags: ["cottage"] });
    const preferences = makePreferences({ vesselStyle: "brass" });
    expect(scoreItem(matching, preferences).vesselStyle).toBe(MATCH_WEIGHTS.vesselStyle);
    expect(scoreItem(notMatching, preferences).vesselStyle).toBe(0);
  });

  it("applies the featured boost regardless of what else was asked", () => {
    const featured = makeItem({ featured: true });
    const notFeatured = makeItem({ featured: false });
    const breakdown = makePreferences();
    expect(scoreItem(featured, breakdown).featured).toBe(MATCH_WEIGHTS.featured);
    expect(scoreItem(notFeatured, breakdown).featured).toBe(0);
  });

  it("keeps the weights summing to 100 across every dimension", () => {
    const total =
      MATCH_WEIGHTS.light +
      MATCH_WEIGHTS.careAndWatering +
      MATCH_WEIGHTS.size +
      MATCH_WEIGHTS.vesselStyle +
      MATCH_WEIGHTS.occasion +
      MATCH_WEIGHTS.featured;
    expect(total).toBe(100);
  });
});
