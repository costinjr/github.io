import { OWNER_ROLES, REFERRAL_PRIORITIES, REFERRAL_STATUSES } from "./types";
import type { OwnerRole, Referral, ReferralPriority, ReferralStatus } from "./types";

// Order follows the spec's own precedence when multiple rules could apply:
// Critical → Today → Manual Review → Needs Information → This Week.
export const QUEUE_BANDS = [
  "Critical",
  "Today",
  "Manual Review",
  "Needs Information",
  "This Week",
  "Unclassified",
  "Closed",
] as const;
export type QueueBand = (typeof QUEUE_BANDS)[number];

const CLOSED_STATUSES: ReferralStatus[] = ["Closed", "Declined"];

export function bandForReferral(referral: Referral): QueueBand {
  if (CLOSED_STATUSES.includes(referral.status)) return "Closed";
  if (referral.priority) return referral.priority;
  return "Unclassified";
}

export function reasonForReferral(referral: Referral): string {
  if (referral.status === "Declined") return "Declined by patient or referring office.";
  if (referral.status === "Closed") return "Closed.";
  if (referral.priority) return `${referral.priority} — assigned by the triage rules.`;
  return "Awaiting triage.";
}

export type QueueFilters = {
  status?: ReferralStatus;
  priority?: ReferralPriority;
  service?: string;
  ownerRole?: OwnerRole;
};

export function filterReferrals(referrals: Referral[], filters: QueueFilters): Referral[] {
  return referrals.filter((referral) => {
    if (filters.status && referral.status !== filters.status) return false;
    if (filters.priority && referral.priority !== filters.priority) return false;
    if (filters.service && referral.serviceRequested !== filters.service) return false;
    if (filters.ownerRole && referral.ownerRole !== filters.ownerRole) return false;
    return true;
  });
}

// A large finite sentinel (not Infinity) so subtracting two "no due date"
// values in the comparator below yields 0, not NaN.
function timeOrMax(value: string | null): number {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

export function sortForQueue(referrals: Referral[]): Referral[] {
  return [...referrals].sort((a, b) => {
    const bandDiff = QUEUE_BANDS.indexOf(bandForReferral(a)) - QUEUE_BANDS.indexOf(bandForReferral(b));
    if (bandDiff !== 0) return bandDiff;

    const dueDiff = timeOrMax(a.dueAt) - timeOrMax(b.dueAt);
    if (dueDiff !== 0) return dueDiff;

    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
  });
}

export function groupByBand(referrals: Referral[]): Record<QueueBand, Referral[]> {
  const groups = Object.fromEntries(QUEUE_BANDS.map((band) => [band, [] as Referral[]])) as Record<
    QueueBand,
    Referral[]
  >;
  for (const referral of sortForQueue(referrals)) {
    groups[bandForReferral(referral)].push(referral);
  }
  return groups;
}

export function distinctServices(referrals: Referral[]): string[] {
  const services = new Set<string>();
  for (const referral of referrals) {
    if (referral.serviceRequested) services.add(referral.serviceRequested);
  }
  return [...services].sort();
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseQueueFilters(searchParams: RawSearchParams): QueueFilters {
  const status = firstValue(searchParams.status);
  const priority = firstValue(searchParams.priority);
  const service = firstValue(searchParams.service);
  const ownerRole = firstValue(searchParams.ownerRole);

  const filters: QueueFilters = {};
  if (status && (REFERRAL_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as ReferralStatus;
  }
  if (priority && (REFERRAL_PRIORITIES as readonly string[]).includes(priority)) {
    filters.priority = priority as ReferralPriority;
  }
  if (service) filters.service = service;
  if (ownerRole && (OWNER_ROLES as readonly string[]).includes(ownerRole)) {
    filters.ownerRole = ownerRole as OwnerRole;
  }
  return filters;
}

export function formatAge(receivedAt: string, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(receivedAt).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
