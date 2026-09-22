import type { InventoryItemRow } from "@/types/database";
import type { MatchPreferences } from "./types";

let counter = 0;

export function makeItem(overrides: Partial<InventoryItemRow> = {}): InventoryItemRow {
  counter += 1;
  return {
    id: `item-${counter}`,
    slug: `item-${counter}`,
    status: "available",
    display_name: `Test Plant ${counter}`,
    plant_description: "Test plant in test vessel",
    price_cents: 2000,
    size_class: "standard",
    light_levels: ["medium"],
    care_difficulty: "easy",
    pet_safety: "unknown",
    plant_common_name: "Test common name",
    plant_botanical_name: null,
    vessel_name: "Test vessel",
    vessel_material: "ceramic",
    vessel_style_tags: [],
    directional_placement: "A few feet from a bright window.",
    watering: "regular",
    dimensions_height_in: null,
    dimensions_width_in: null,
    featured: false,
    sort_order: 0,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makePreferences(overrides: Partial<MatchPreferences> = {}): MatchPreferences {
  return {
    light: "unknown",
    petSafetyRequired: "unknown",
    careTolerance: "unknown",
    size: "unknown",
    watering: "unknown",
    occasion: "unknown",
    vesselStyle: "unknown",
    budgetMax: null,
    keywords: [],
    ...overrides,
  };
}
