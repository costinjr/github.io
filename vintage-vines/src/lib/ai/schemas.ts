import { z } from "zod";

// Mirrors MatchPreferences (src/lib/matching/types.ts) exactly — this is
// the strict shape the AI parser's structured output must satisfy
// before it's trusted (section 6: "The parser may only return the
// preference fields above").
export const preferencesSchema = z.object({
  light: z.enum(["low", "medium", "high", "unknown"]),
  petSafetyRequired: z.union([z.boolean(), z.literal("unknown")]),
  careTolerance: z.enum(["easy", "moderate", "involved", "unknown"]),
  size: z.enum(["small", "medium", "large", "unknown"]),
  watering: z.enum(["infrequent", "regular", "frequent", "unknown"]),
  occasion: z.enum([
    "self",
    "closing_gift",
    "birthday",
    "sympathy",
    "host",
    "office",
    "other",
    "unknown",
  ]),
  vesselStyle: z.enum([
    "brass",
    "ceramic",
    "stoneware",
    "cottage",
    "minimal",
    "colorful",
    "neutral",
    "other",
    "unknown",
  ]),
  budgetMax: z.number().int().positive().nullable(),
  keywords: z.array(z.string()).max(10),
});

// Section 6's AI output contract table, field for field.
export const blurbSchema = z.object({
  selectedInventoryId: z.uuid(),
  alternateInventoryIds: z.array(z.uuid()).max(2),
  headline: z.string().max(70),
  reason: z.string().max(700), // generous character ceiling; word count checked separately
  careNote: z.string().min(1),
  constraintNotes: z.array(z.string()),
});

export type AiBlurbOutput = z.infer<typeof blurbSchema>;
