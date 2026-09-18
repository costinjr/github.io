import { OWNER_ROLES } from "@/lib/types";

export const CLINIC_NAME = "Northstar Specialty Clinic";

export const SERVICES = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Pulmonology",
] as const;

export { OWNER_ROLES };

// The minimum a referral needs to count as "complete" — matches the
// vocabulary the extraction prompt (config/triage-prompt.v1.md) uses for
// missing_fields, so the rules engine can check for these by name.
export const REQUIRED_FIELDS = ["patient_contact", "referring_clinician", "reason_for_referral", "clinical_records"] as const;

// Phrases that, if they appear in the model's urgency_label_from_source or
// urgency_clues, mean the referring office directed same-day review —
// Critical, regardless of anything else in the referral.
export const EMERGENCY_ESCALATION_PHRASES = ["stat", "same-day review", "same day review"];

// Phrases indicating the situations the spec calls out for the Today band:
// marked urgent, postoperative concern, suspected malignancy, rapidly
// worsening symptoms, or a time-sensitive medication/procedure issue.
export const URGENT_TODAY_PHRASES = [
  "urgent",
  "post-op",
  "postop",
  "post op",
  "malignan", // matches "malignant" and "malignancy"
  "worsening",
  "time-sensitive",
  "time sensitive",
];

// Below this, the model's own extraction isn't trusted enough to drive
// scheduling — routed to Manual Review instead.
export const CONFIDENCE_THRESHOLD = 0.6;

export const OPERATING_HOURS = {
  // Demo simplification: fixed UTC hours, no holiday calendar. See README.
  businessDays: [1, 2, 3, 4, 5], // Monday-Friday; 0 = Sunday
  endOfDayHourUtc: 17,
};
