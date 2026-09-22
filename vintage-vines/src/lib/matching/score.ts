import type { CareDifficulty, InventoryItemRow, SizeClass, Watering } from "@/types/database";
import { MATCH_WEIGHTS } from "./config";
import type { MatchPreferences, ScoreBreakdown, SizePreference } from "./types";

const CARE_ORDER: CareDifficulty[] = ["easy", "moderate", "involved"];
const WATERING_ORDER: Watering[] = ["infrequent", "regular", "frequent"];
const SIZE_ORDER: SizeClass[] = ["small", "standard", "large"];

/** The one place that reconciles the preference object's "medium" with inventory's "standard" — see types.ts. */
export function mapSizePreferenceToSizeClass(size: SizePreference): SizeClass | null {
  switch (size) {
    case "small":
      return "small";
    case "medium":
      return "standard";
    case "large":
      return "large";
    case "unknown":
      return null;
  }
}

/** 1 for an exact match, fading linearly to 0 at the far end of a 3-point ordinal scale. */
function ordinalFit<T>(order: T[], a: T, b: T): number {
  const distance = Math.abs(order.indexOf(a) - order.indexOf(b));
  const maxDistance = order.length - 1;
  return maxDistance === 0 ? 1 : 1 - distance / maxDistance;
}

export function scoreItem(item: InventoryItemRow, preferences: MatchPreferences): ScoreBreakdown {
  let total = 0;
  let possibleMax = 0;

  // Light: the hard filter (filters.ts) already guarantees any survivor
  // supports the requested level when one was stated, so a specified
  // preference earns full marks here — this dimension exists to rank
  // survivors against candidates matched on other axes, not to
  // re-grade something the filter already settled.
  let light = 0;
  if (preferences.light !== "unknown") {
    possibleMax += MATCH_WEIGHTS.light;
    light = MATCH_WEIGHTS.light;
  }

  // Care + watering share one 25-point line in section 6's table.
  // Split evenly; each fades with ordinal distance rather than being
  // all-or-nothing, so "asked for easy, got moderate" still scores
  // better than "asked for easy, got involved."
  let careAndWatering = 0;
  const careMax = MATCH_WEIGHTS.careAndWatering / 2;
  const wateringMax = MATCH_WEIGHTS.careAndWatering / 2;
  if (preferences.careTolerance !== "unknown") {
    possibleMax += careMax;
    careAndWatering += careMax * ordinalFit(CARE_ORDER, item.care_difficulty, preferences.careTolerance);
  }
  if (preferences.watering !== "unknown" && item.watering) {
    possibleMax += wateringMax;
    careAndWatering += wateringMax * ordinalFit(WATERING_ORDER, item.watering, preferences.watering);
  }

  let size = 0;
  const sizeClass = mapSizePreferenceToSizeClass(preferences.size);
  if (sizeClass) {
    possibleMax += MATCH_WEIGHTS.size;
    size = MATCH_WEIGHTS.size * ordinalFit(SIZE_ORDER, item.size_class, sizeClass);
  }

  // Vessel style: "soft preference only" — a categorical tag, so it's
  // either a match or it isn't, no partial credit.
  let vesselStyle = 0;
  if (preferences.vesselStyle !== "unknown") {
    possibleMax += MATCH_WEIGHTS.vesselStyle;
    if (item.vessel_style_tags.includes(preferences.vesselStyle)) {
      vesselStyle = MATCH_WEIGHTS.vesselStyle;
    }
  }

  // Occasion: section 6 calls this "copy and tie-breaker only" in the
  // preference-object table, but gives it a 10-point line in the
  // scoring table. Folding it into the composite score satisfies both:
  // it's a real scoring input, and — because it's additive — it's
  // exactly what separates two otherwise-tied candidates.
  //
  // There is no occasion-shaped field on inventory_items to score
  // against (no "good for closing gifts" column), and the spec doesn't
  // say how one should map to item attributes, so this always
  // contributes 0 rather than guessing a mapping. Recorded in
  // HANDOFF.md. `featured` (below) is the closest existing lever an
  // admin has for "this piece reads well as a gift."
  const occasion = 0;

  const featured = item.featured ? MATCH_WEIGHTS.featured : 0;
  possibleMax += MATCH_WEIGHTS.featured;

  total = light + careAndWatering + size + vesselStyle + occasion + featured;

  return { light, careAndWatering, size, vesselStyle, occasion, featured, total, possibleMax };
}
