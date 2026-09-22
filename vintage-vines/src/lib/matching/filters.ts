import type { InventoryItemRow } from "@/types/database";
import type { MatchPreferences } from "./types";

/**
 * Pet safety and budget: "Never relax pet safety or an explicit
 * budget" (section 6). These items are never eligible, under any
 * circumstances, regardless of what else the matcher tries.
 */
export function applyNonNegotiableFilters(
  items: InventoryItemRow[],
  preferences: MatchPreferences,
): InventoryItemRow[] {
  return items.filter((item) => {
    if (preferences.petSafetyRequired === true && item.pet_safety !== "pet_safe") {
      return false;
    }
    if (preferences.budgetMax !== null && item.price_cents > preferences.budgetMax) {
      return false;
    }
    return true;
  });
}

/**
 * Light: "Hard constraint when clearly stated; otherwise neutral."
 * Kept separate from the non-negotiable filters above because a light
 * mismatch, unlike pet safety or budget, is allowed to fall back to a
 * named "closest safe option" (section 6).
 */
export function applyLightFilter(
  items: InventoryItemRow[],
  preferences: MatchPreferences,
): InventoryItemRow[] {
  const { light } = preferences;
  if (light === "unknown") return items;
  return items.filter((item) => item.light_levels.includes(light));
}
