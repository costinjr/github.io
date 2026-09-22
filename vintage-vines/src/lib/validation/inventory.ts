import { z } from "zod";

// Mirrors the two-tier requirement split enforced by
// inventory_items_publish_requires_details in the database: a handful of
// fields are required from the moment a draft exists, the rest only once
// status moves to available/checkout_hold/sold.

export const sizeClasses = ["small", "standard", "large"] as const;
export const lightLevels = ["low", "medium", "high"] as const;
export const careDifficulties = ["easy", "moderate", "involved"] as const;
export const petSafetyValues = ["pet_safe", "toxic", "unknown"] as const;
export const vesselMaterials = ["brass", "ceramic", "stoneware", "other"] as const;
export const waterings = ["infrequent", "regular", "frequent"] as const;
export const windowDirections = ["north", "east", "south", "west", "flexible"] as const;
export const windowDistances = [
  "windowsill",
  "within_1_3_ft",
  "3_6_ft",
  "farther_with_ambient_light",
] as const;
export const directSunLevels = ["none", "gentle_morning", "limited", "several_hours"] as const;

export const draftItemSchema = z.object({
  display_name: z.string().trim().min(1, "Give this piece a fun name."),
  plant_description: z.string().trim().min(1, "Describe the plant and vessel in one line."),
  price_cents: z.coerce.number().int().positive("Price must be greater than zero."),
  size_class: z.enum(sizeClasses),
  light_levels: z.array(z.enum(lightLevels)).min(1, "Choose at least one light level."),
  care_difficulty: z.enum(careDifficulties),
  pet_safety: z.enum(petSafetyValues).default("unknown"),
});

export const publishExtraSchema = z.object({
  plant_common_name: z.string().trim().min(1, "Plant common name is required to publish."),
  vessel_name: z.string().trim().min(1, "Vessel name is required to publish."),
  vessel_material: z.enum(vesselMaterials, {
    error: "Vessel material is required to publish.",
  }),
  directional_placement: z
    .string()
    .trim()
    .min(1, "Directional placement is required to publish."),
  watering: z.enum(waterings, { error: "Watering is required to publish." }),
});

export const optionalItemFieldsSchema = z.object({
  plant_botanical_name: z.string().trim().optional(),
  vessel_style_tags: z.array(z.string().trim()).default([]),
  dimensions_height_in: z.coerce.number().positive().optional(),
  dimensions_width_in: z.coerce.number().positive().optional(),
  featured: z.coerce.boolean().default(false),
});

export const directionalPlacementInputSchema = z.object({
  window_direction: z.enum(windowDirections).optional(),
  window_distance: z.enum(windowDistances).optional(),
  direct_sun: z.enum(directSunLevels).optional(),
  seasonal_note: z.string().trim().optional(),
  obstruction_note: z.string().trim().optional(),
});

export type DirectionalPlacementInput = z.infer<typeof directionalPlacementInputSchema>;

const directionLabels: Record<(typeof windowDirections)[number], string> = {
  north: "a north-facing window",
  east: "an east-facing window",
  south: "a south-facing window",
  west: "a west-facing window",
  flexible: "a window in any direction",
};

const distanceLabels: Record<(typeof windowDistances)[number], string> = {
  windowsill: "right on the windowsill",
  within_1_3_ft: "within 1 to 3 feet of",
  "3_6_ft": "3 to 6 feet back from",
  farther_with_ambient_light: "farther back, as long as the room stays visibly bright near",
};

const directSunLabels: Record<(typeof directSunLevels)[number], string> = {
  none: "Keep direct sun off the leaves.",
  gentle_morning: "Gentle morning sun is fine.",
  limited: "A little midday sun is fine, but watch for scorching.",
  several_hours: "This one wants several hours of direct sun.",
};

/**
 * Builds the plain-language placement sentence from structured fields
 * (section 7). The admin form lets Libby edit the generated sentence
 * afterward — this is only the starting point, not a locked value.
 */
export function buildDirectionalPlacement(input: DirectionalPlacementInput): string {
  if (!input.window_direction || !input.window_distance) return "";

  const distance = distanceLabels[input.window_distance];
  const direction = directionLabels[input.window_direction];
  const sun = input.direct_sun ? directSunLabels[input.direct_sun] : "";

  let sentence = `Best ${distance} ${direction}.`;
  if (sun) sentence += ` ${sun}`;
  if (input.obstruction_note) sentence += ` ${input.obstruction_note}`;
  if (input.seasonal_note) sentence += ` ${input.seasonal_note}`;

  return sentence.trim();
}
