import {
  CONFIDENCE_THRESHOLD,
  EMERGENCY_ESCALATION_PHRASES,
  OPERATING_HOURS,
  REQUIRED_FIELDS,
  SERVICES,
  URGENT_TODAY_PHRASES,
} from "./clinic.v1";
import type { ExtractionResult } from "@/lib/extraction/schema";
import type { OwnerRole, ReferralPriority } from "@/lib/types";

export const TRIAGE_RULES_VERSION = "v1";

export type RuleInput = {
  extraction: ExtractionResult;
  receivedAt: string;
};

export type RuleOutcome = {
  priority: ReferralPriority;
  ownerRole: OwnerRole;
  dueAt: string;
  ruleHits: string[];
};

const OWNER_ROLE_BY_PRIORITY: Record<ReferralPriority, OwnerRole> = {
  Critical: "Triage Lead",
  Today: "Triage Nurse",
  "Manual Review": "Triage Lead",
  "Needs Information": "Intake",
  "This Week": "Scheduling",
};

function containsPhrase(haystacks: (string | null)[], phrases: string[]): string | null {
  for (const haystack of haystacks) {
    if (!haystack) continue;
    const lower = haystack.toLowerCase();
    for (const phrase of phrases) {
      if (lower.includes(phrase)) return haystack;
    }
  }
  return null;
}

type RuleMatch = { priority: ReferralPriority; reason: string };

function evaluateCritical(extraction: ExtractionResult): RuleMatch | null {
  const hit = containsPhrase(
    [extraction.urgency_label_from_source, ...extraction.urgency_clues],
    EMERGENCY_ESCALATION_PHRASES,
  );
  if (!hit) return null;
  return { priority: "Critical", reason: `Critical: "${hit}" matches an emergency escalation phrase.` };
}

function evaluateToday(extraction: ExtractionResult): RuleMatch | null {
  const hit = containsPhrase(
    [extraction.urgency_label_from_source, ...extraction.urgency_clues, ...extraction.contradictions],
    URGENT_TODAY_PHRASES,
  );
  if (!hit) return null;
  return { priority: "Today", reason: `Today: "${hit}" matches an urgent-today signal.` };
}

function evaluateManualReview(extraction: ExtractionResult): RuleMatch | null {
  if (extraction.contradictions.length > 0) {
    return { priority: "Manual Review", reason: "Manual Review: the referral contains conflicting urgency cues." };
  }
  if (extraction.suggested_route && !(SERVICES as readonly string[]).includes(extraction.suggested_route)) {
    return {
      priority: "Manual Review",
      reason: `Manual Review: suggested route "${extraction.suggested_route}" is not a service this clinic offers.`,
    };
  }
  if (extraction.confidence < CONFIDENCE_THRESHOLD) {
    return {
      priority: "Manual Review",
      reason: `Manual Review: extraction confidence ${extraction.confidence} is below the ${CONFIDENCE_THRESHOLD} threshold.`,
    };
  }
  return null;
}

function evaluateNeedsInformation(extraction: ExtractionResult): RuleMatch | null {
  const missingRequired = extraction.missing_fields.filter((field) =>
    (REQUIRED_FIELDS as readonly string[]).includes(field),
  );
  if (missingRequired.length === 0) return null;
  return { priority: "Needs Information", reason: `Needs Information: missing ${missingRequired.join(", ")}.` };
}

function isBusinessDay(date: Date): boolean {
  return (OPERATING_HOURS.businessDays as readonly number[]).includes(date.getUTCDay());
}

function endOfCurrentBusinessDay(receivedAt: Date): Date {
  const due = new Date(receivedAt);
  due.setUTCHours(OPERATING_HOURS.endOfDayHourUtc, 0, 0, 0);
  return due;
}

function addBusinessDays(receivedAt: Date, days: number): Date {
  const due = new Date(receivedAt);
  let remaining = days;
  while (remaining > 0) {
    due.setUTCDate(due.getUTCDate() + 1);
    if (isBusinessDay(due)) remaining -= 1;
  }
  due.setUTCHours(OPERATING_HOURS.endOfDayHourUtc, 0, 0, 0);
  return due;
}

function computeDueAt(priority: ReferralPriority, receivedAt: Date): string {
  switch (priority) {
    case "Critical":
      return receivedAt.toISOString(); // immediate review
    case "Today":
      return endOfCurrentBusinessDay(receivedAt).toISOString();
    case "Manual Review":
    case "Needs Information":
      return addBusinessDays(receivedAt, 1).toISOString();
    case "This Week":
      return addBusinessDays(receivedAt, 2).toISOString();
  }
}

// Deterministic — the model extracts and suggests (lib/extraction), this
// function alone assigns priority, owner, and due time. Precedence when
// more than one rule matches: Critical -> Today -> Manual Review ->
// Needs Information -> This Week (the spec's own "safer path wins" order).
export function applyTriageRules(input: RuleInput): RuleOutcome {
  const { extraction, receivedAt } = input;

  const matches = [evaluateCritical, evaluateToday, evaluateManualReview, evaluateNeedsInformation]
    .map((evaluate) => evaluate(extraction))
    .filter((match): match is RuleMatch => match !== null);

  const winner: RuleMatch =
    matches[0] ?? { priority: "This Week", reason: "This Week: complete routine referral; no other rule matched." };

  return {
    priority: winner.priority,
    ownerRole: OWNER_ROLE_BY_PRIORITY[winner.priority],
    dueAt: computeDueAt(winner.priority, new Date(receivedAt)),
    ruleHits: matches.length > 0 ? matches.map((match) => match.reason) : [winner.reason],
  };
}
