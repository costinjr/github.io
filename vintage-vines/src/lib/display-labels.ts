import type { CareDifficulty, LightLevel, PetSafety, Watering } from "@/types/database";

export const lightLevelLabels: Record<LightLevel, string> = {
  low: "Low light OK",
  medium: "Medium light",
  high: "Bright light",
};

export const careDifficultyLabels: Record<CareDifficulty, string> = {
  easy: "Easy care",
  moderate: "Moderate care",
  involved: "Involved care",
};

// unknown is never presented as safe (section 7).
export const petSafetyLabels: Record<PetSafety, string> = {
  pet_safe: "Pet friendly",
  toxic: "Toxic to pets",
  unknown: "Pet safety unknown",
};

export const wateringLabels: Record<Watering, string> = {
  infrequent: "Infrequent watering",
  regular: "Regular watering",
  frequent: "Frequent watering",
};

export const vesselStyleOptions = [
  "brass",
  "ceramic",
  "stoneware",
  "cottage",
  "minimal",
  "colorful",
  "neutral",
  "other",
] as const;
