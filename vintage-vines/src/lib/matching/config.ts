// Single source of truth for the matcher's weights (section 6: "Keep
// weights in one configuration module with tests"). These sum to 100 —
// that's not a coincidence, it's how the spec's own point breakdown
// reads once light/pet-safety/budget are pulled out as hard filters
// rather than scored dimensions.
export const MATCH_WEIGHTS = {
  light: 35,
  careAndWatering: 25,
  size: 15,
  vesselStyle: 10,
  occasion: 10,
  featured: 5,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  strong: 0.85,
  good: 0.6,
} as const;

// Below this many explicitly-specified (non-"unknown") preferences,
// confidence is capped at "limited" even at a perfect score ratio —
// matching too little to call it a strong match.
export const MIN_SPECIFIED_PREFERENCES_FOR_CONFIDENCE = 1;
