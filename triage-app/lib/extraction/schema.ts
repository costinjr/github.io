import { z } from "zod";
import { SERVICES } from "@/config/clinic.v1";

// The subset of fields an evidence quote can back — the "conclusions" that
// need a pinpoint citation, as opposed to derived characterizations like
// completeness or the summary.
export const EVIDENCE_BACKED_FIELDS = [
  "requested_service",
  "urgency_label_from_source",
  "referring_clinician",
  "suggested_route",
] as const;

export const EvidenceQuoteSchema = z.object({
  field: z.enum(EVIDENCE_BACKED_FIELDS),
  quote: z.string().min(1),
});

export const ExtractionResultSchema = z.object({
  requested_service: z.enum(SERVICES).nullable(),
  urgency_label_from_source: z.string().nullable(),
  urgency_clues: z.array(z.string()),
  completeness: z.enum(["complete", "incomplete"]),
  missing_fields: z.array(z.string()),
  referring_clinician: z.string().nullable(),
  patient_contact_present: z.boolean(),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence_quotes: z.array(EvidenceQuoteSchema),
  contradictions: z.array(z.string()),
  suggested_route: z.string().nullable(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type EvidenceQuote = z.infer<typeof EvidenceQuoteSchema>;
