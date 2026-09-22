import type { MatchPreferences } from "@/lib/matching/types";

/**
 * Section 6: "AI unavailable: run deterministic matching from any
 * explicit criteria and use templated copy." This only ever sets a
 * field when the text has an unambiguous signal for it — anything less
 * clear stays "unknown" rather than guessing. It's the same function
 * whether the AI key is simply missing or a live call just failed.
 */
export function parsePreferencesDeterministically(text: string): MatchPreferences {
  const lower = text.toLowerCase();

  return {
    light: parseLight(lower),
    petSafetyRequired: parsePetSafety(lower),
    careTolerance: parseCareTolerance(lower),
    size: parseSize(lower),
    watering: parseWatering(lower),
    occasion: parseOccasion(lower),
    vesselStyle: parseVesselStyle(lower),
    budgetMax: parseBudget(lower),
    keywords: extractKeywords(lower),
  };
}

function parseLight(text: string): MatchPreferences["light"] {
  if (/\b(low light|dim|shade|shady|north.?facing|dark (room|office|corner))\b/.test(text)) {
    return "low";
  }
  if (/\b(bright|sunny|south.?facing|direct sun|lots? of (sun|light))\b/.test(text)) {
    return "high";
  }
  if (/\b(medium light|indirect light|east.?facing|west.?facing)\b/.test(text)) {
    return "medium";
  }
  return "unknown";
}

function parsePetSafety(text: string): MatchPreferences["petSafetyRequired"] {
  if (/\b(pet.?safe|pet.?friendly|dog|cat|kitten|puppy|toddler|kids?)\b/.test(text)) {
    return true;
  }
  return "unknown";
}

function parseCareTolerance(text: string): MatchPreferences["careTolerance"] {
  if (/\b(forget to water|low maintenance|beginner|black thumb|never home|travel (a lot|often))\b/.test(text)) {
    return "easy";
  }
  if (/\b(experienced|plant parent|don'?t mind (extra|the) (care|work)|enjoy the challenge)\b/.test(text)) {
    return "involved";
  }
  return "unknown";
}

function parseSize(text: string): MatchPreferences["size"] {
  if (/\b(desk|small space|tiny|apartment|nightstand|shelf)\b/.test(text)) {
    return "small";
  }
  if (/\b(floor|large|big|statement piece|corner of the room)\b/.test(text)) {
    return "large";
  }
  return "unknown";
}

function parseWatering(text: string): MatchPreferences["watering"] {
  if (/\b(forget to water|travel (a lot|often)|infrequent|out of town)\b/.test(text)) {
    return "infrequent";
  }
  if (/\b(water (it )?(often|frequently|daily)|love watering)\b/.test(text)) {
    return "frequent";
  }
  return "unknown";
}

function parseOccasion(text: string): MatchPreferences["occasion"] {
  if (/\b(closing gift|realtor|new home(owner)?)\b/.test(text)) return "closing_gift";
  if (/\bbirthday\b/.test(text)) return "birthday";
  if (/\b(sympathy|condolence|funeral|loss of)\b/.test(text)) return "sympathy";
  if (/\bhost(ess)? gift\b/.test(text)) return "host";
  if (/\b(office|desk at work|coworker)\b/.test(text)) return "office";
  if (/\b(for me|myself|my own space)\b/.test(text)) return "self";
  if (/\b(gift|present)\b/.test(text)) return "other";
  return "unknown";
}

function parseVesselStyle(text: string): MatchPreferences["vesselStyle"] {
  const styles: MatchPreferences["vesselStyle"][] = [
    "brass",
    "ceramic",
    "stoneware",
    "cottage",
    "minimal",
    "colorful",
    "neutral",
  ];
  for (const style of styles) {
    if (text.includes(style)) return style;
  }
  return "unknown";
}

function parseBudget(text: string): number | null {
  const match = text.match(/\$\s?(\d{1,4})(?:\.\d{2})?/);
  if (!match) return null;
  const dollars = Number(match[1]);
  return Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
}

const STOPWORDS = new Set([
  "the", "a", "an", "for", "and", "to", "of", "in", "on", "with", "is", "it", "my", "i",
]);

function extractKeywords(text: string): string[] {
  return [...new Set(text.match(/[a-z]{4,}/g) ?? [])]
    .filter((word) => !STOPWORDS.has(word))
    .slice(0, 10);
}
