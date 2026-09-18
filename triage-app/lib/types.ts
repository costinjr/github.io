export const REFERRAL_STATUSES = [
  "New",
  "Needs Information",
  "Ready to Schedule",
  "Scheduled",
  "Closed",
  "Declined",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_PRIORITIES = ["Critical", "Today", "This Week", "Needs Information", "Manual Review"] as const;
export type ReferralPriority = (typeof REFERRAL_PRIORITIES)[number];

export const OWNER_ROLES = ["Triage Lead", "Triage Nurse", "Scheduling", "Intake"] as const;
export type OwnerRole = (typeof OWNER_ROLES)[number];

export type Referral = {
  id: string;
  source: string;
  rawText: string;
  receivedAt: string;
  serviceRequested: string | null;
  status: ReferralStatus;
  priority: ReferralPriority | null;
  ownerRole: OwnerRole | null;
  dueAt: string | null;
  completeness: "complete" | "incomplete" | null;
  missingFields: string[];
  currentTriageRunId: string | null;
  isSynthetic: boolean;
};

export const WORKFLOW_EVENT_TYPES = ["status_change", "note"] as const;
export type WorkflowEventType = (typeof WORKFLOW_EVENT_TYPES)[number];

export type WorkflowEvent = {
  id: string;
  referralId: string;
  createdAt: string;
  eventType: WorkflowEventType;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
};

export type TriageRun = {
  id: string;
  referralId: string;
  createdAt: string;
  model: string | null;
  promptVersion: string | null;
  rulesVersion: string | null;
  extractedJson: unknown;
  evidenceJson: unknown;
  confidence: number | null;
  ruleHits: unknown;
  finalPriority: string | null;
  finalRoute: string | null;
};
