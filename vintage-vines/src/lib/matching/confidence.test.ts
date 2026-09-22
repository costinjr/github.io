import { describe, expect, it } from "vitest";
import { computeConfidence } from "./confidence";
import { makePreferences } from "./test-fixtures";
import type { ScoreBreakdown } from "./types";

function breakdown(total: number, possibleMax: number): ScoreBreakdown {
  return { light: 0, careAndWatering: 0, size: 0, vesselStyle: 0, occasion: 0, featured: 0, total, possibleMax };
}

describe("computeConfidence", () => {
  it("is strong at a high achieved ratio with real preferences specified", () => {
    const preferences = makePreferences({ light: "low", careTolerance: "easy" });
    expect(computeConfidence(breakdown(90, 100), preferences)).toBe("strong");
  });

  it("is good in the middle band", () => {
    const preferences = makePreferences({ light: "low" });
    expect(computeConfidence(breakdown(70, 100), preferences)).toBe("good");
  });

  it("is limited at a low ratio", () => {
    const preferences = makePreferences({ light: "low" });
    expect(computeConfidence(breakdown(20, 100), preferences)).toBe("limited");
  });

  it("caps a perfect ratio at limited when nothing meaningful was actually specified", () => {
    // Only the always-on featured weight was in play — a perfect ratio
    // here reflects that one boolean, not a real match.
    const preferences = makePreferences();
    expect(computeConfidence(breakdown(5, 5), preferences)).toBe("limited");
  });

  it("treats a zero possible-max as limited rather than dividing by zero", () => {
    const preferences = makePreferences();
    expect(computeConfidence(breakdown(0, 0), preferences)).toBe("limited");
  });
});
