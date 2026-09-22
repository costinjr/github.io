import { describe, expect, it } from "vitest";
import { parsePreferencesDeterministically } from "./fallback-parser";

describe("parsePreferencesDeterministically", () => {
  it("extracts low light, pet safety, and infrequent watering from a realistic sentence", () => {
    const result = parsePreferencesDeterministically(
      "I travel often and forget to water, and it needs to be pet-friendly for my dog. My office is pretty dim.",
    );
    expect(result.light).toBe("low");
    expect(result.petSafetyRequired).toBe(true);
    expect(result.watering).toBe("infrequent");
  });

  it("extracts an explicit dollar budget as cents", () => {
    const result = parsePreferencesDeterministically("Looking for something under $25 for a gift.");
    expect(result.budgetMax).toBe(2500);
  });

  it("leaves budget null when no dollar amount is mentioned", () => {
    const result = parsePreferencesDeterministically("Something nice for my kitchen.");
    expect(result.budgetMax).toBeNull();
  });

  it("recognizes a closing gift occasion", () => {
    const result = parsePreferencesDeterministically("A closing gift for a client who just bought a house.");
    expect(result.occasion).toBe("closing_gift");
  });

  it("stays unknown rather than guessing when nothing is explicit", () => {
    const result = parsePreferencesDeterministically("Surprise me!");
    expect(result.light).toBe("unknown");
    expect(result.careTolerance).toBe("unknown");
    expect(result.size).toBe("unknown");
    expect(result.watering).toBe("unknown");
    expect(result.vesselStyle).toBe("unknown");
    expect(result.petSafetyRequired).toBe("unknown");
  });

  it("recognizes a bright/sunny cue as high light, not low", () => {
    const result = parsePreferencesDeterministically("It'll live in a sunny south-facing window.");
    expect(result.light).toBe("high");
  });

  it("does not treat a mention of an unrelated dollar-shaped number as a budget when absent", () => {
    const result = parsePreferencesDeterministically("I have 3 cats and a sunny kitchen.");
    expect(result.budgetMax).toBeNull();
  });
});
