import { describe, expect, it } from "vitest";
import { validateBlurb } from "./validate-blurb";
import type { CandidateFacts } from "./provider";
import type { AiBlurbOutput } from "./schemas";

const selected: CandidateFacts = {
  id: "11111111-1111-1111-1111-111111111111",
  displayName: "Betty",
  plantDescription: "Snake plant in brass tumbler",
  priceCents: 2000,
  lightLevels: ["low", "medium"],
  careDifficulty: "easy",
  petSafety: "unknown",
  watering: "infrequent",
  directionalPlacement: "A few feet from a window.",
};

const alternate: CandidateFacts = { ...selected, id: "22222222-2222-2222-2222-222222222222" };

function makeBlurb(overrides: Partial<AiBlurbOutput> = {}): AiBlurbOutput {
  return {
    selectedInventoryId: selected.id,
    alternateInventoryIds: [],
    headline: "Betty could be a great fit.",
    reason: "This easy-care snake plant tolerates low light and is available now for $20.",
    careNote: "Water infrequently, letting the soil dry out between waterings.",
    constraintNotes: [],
    ...overrides,
  };
}

describe("validateBlurb", () => {
  it("accepts a well-formed blurb that only states real facts", () => {
    const result = validateBlurb(makeBlurb(), {
      selected,
      alternates: [alternate],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a selectedInventoryId that doesn't match the actual candidate", () => {
    const result = validateBlurb(makeBlurb({ selectedInventoryId: "99999999-9999-9999-9999-999999999999" }), {
      selected,
      alternates: [],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects an alternate id that was never offered as a candidate", () => {
    const result = validateBlurb(makeBlurb({ alternateInventoryIds: ["99999999-9999-9999-9999-999999999999"] }), {
      selected,
      alternates: [alternate],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a wrong price", () => {
    const result = validateBlurb(makeBlurb({ reason: "Available now for $35, a great deal." }), {
      selected,
      alternates: [],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("$35");
  });

  it("accepts the correct price stated exactly", () => {
    const result = validateBlurb(makeBlurb({ reason: "This one is $20 and easy to care for." }), {
      selected,
      alternates: [],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a care claim that contradicts the record — never calls an involved plant easy", () => {
    const involved: CandidateFacts = { ...selected, careDifficulty: "involved" };
    const result = validateBlurb(makeBlurb({ reason: "This easy, low-maintenance plant is available now." }), {
      selected: involved,
      alternates: [],
      requiredConstraintNotes: [],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a headline over 70 characters", () => {
    const result = validateBlurb(
      makeBlurb({ headline: "A".repeat(71) }),
      { selected, alternates: [], requiredConstraintNotes: [] },
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a reason over 90 words", () => {
    const result = validateBlurb(
      makeBlurb({ reason: Array(91).fill("word").join(" ") }),
      { selected, alternates: [], requiredConstraintNotes: [] },
    );
    expect(result.valid).toBe(false);
  });

  it("rejects silently dropping a required constraint note", () => {
    const result = validateBlurb(makeBlurb({ constraintNotes: [] }), {
      selected,
      alternates: [],
      requiredConstraintNotes: ["Nothing matches the exact light level requested."],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts when a required constraint note is actually carried through", () => {
    const result = validateBlurb(makeBlurb({ constraintNotes: ["Light isn't an exact match, but it's the closest safe option."] }), {
      selected,
      alternates: [],
      requiredConstraintNotes: ["Nothing matches the exact light level requested."],
    });
    expect(result.valid).toBe(true);
  });
});
