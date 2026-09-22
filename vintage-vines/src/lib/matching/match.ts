import type { InventoryItemRow } from "@/types/database";
import { applyLightFilter, applyNonNegotiableFilters } from "./filters";
import { computeConfidence } from "./confidence";
import { scoreItem } from "./score";
import type { MatchOutcome, MatchPreferences, ScoredCandidate } from "./types";

function rankCandidates(
  items: InventoryItemRow[],
  preferences: MatchPreferences,
): ScoredCandidate[] {
  return items
    .map((item) => ({ item, breakdown: scoreItem(item, preferences) }))
    .sort((a, b) => b.breakdown.total - a.breakdown.total);
}

function describeLimitingReason(preferences: MatchPreferences): string {
  // Checked in the same order applyNonNegotiableFilters checks them —
  // whichever one is actually blocking gets named, not both at once.
  if (preferences.petSafetyRequired === true) {
    return "pet safety";
  }
  if (preferences.budgetMax !== null) {
    return "budget";
  }
  return "your criteria";
}

/**
 * Section 6's pipeline, steps 1–5 (step 6 onward — handing this to a
 * language model for prose — is Phase 7). Never returns an item that
 * isn't in `items`, never relaxes pet safety or an explicit budget, and
 * is explicit whenever it has to compromise on anything else.
 */
export function matchInventory(
  items: InventoryItemRow[],
  preferences: MatchPreferences,
): MatchOutcome {
  if (items.length === 0) {
    return { kind: "no_inventory" };
  }

  const safeCandidates = applyNonNegotiableFilters(items, preferences);
  if (safeCandidates.length === 0) {
    return { kind: "no_compatible_result", limitingReason: describeLimitingReason(preferences) };
  }

  const strictCandidates = applyLightFilter(safeCandidates, preferences);

  if (strictCandidates.length > 0) {
    const ranked = rankCandidates(strictCandidates, preferences);
    const [selected, ...alternates] = ranked;
    return {
      kind: "matched",
      selected,
      alternates: alternates.slice(0, 2),
      confidence: computeConfidence(selected.breakdown, preferences),
      constraintNotes: [],
    };
  }

  // Every safety/budget-safe candidate failed only the light filter —
  // section 6: "offer the closest safe option only if the mismatch is
  // harmless and named."
  const ranked = rankCandidates(safeCandidates, preferences);
  const [selected, ...alternates] = ranked;
  return {
    kind: "closest_safe",
    selected,
    alternates: alternates.slice(0, 2),
    confidence: computeConfidence(selected.breakdown, preferences),
    constraintNotes: [
      `Nothing available today matches the ${preferences.light} light you mentioned — this is the closest safe option.`,
    ],
  };
}
