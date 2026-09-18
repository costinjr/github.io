// Northstar Specialty Clinic — the nine synthetic demo referrals.
// All names, organizations, dates, and phone numbers are fictional.
// `expectedOutcome` documents the result the triage rules and extraction
// should produce once those pipelines exist (Sessions 5–7); it is not
// applied by anything in this file.

export type DemoCase = {
  id: string;
  source: "paste" | "form";
  rawText: string;
  /** How long before "now" this referral should appear to have arrived, for queue age variety. */
  receivedOffsetMinutes: number;
  expectedOutcome: string;
};

export const DEMO_CASES_V1: DemoCase[] = [
  {
    id: "NR-001",
    source: "paste",
    rawText:
      "STAT - Dr. Elena Park requesting same-day review. Jordan Avery, 202-555-0101. Rapidly worsening facial swelling after recent procedure. Office callback 202-555-0191. Note and medication list attached.",
    receivedOffsetMinutes: 20,
    expectedOutcome:
      'Critical; Triage Lead; same-day review; complete enough to review; quote "STAT" and "same-day review."',
  },
  {
    id: "NR-002",
    source: "paste",
    rawText:
      "Urgent GI referral from Maple Family Medicine. Casey Brooks, 202-555-0102. Suspected malignancy based on abnormal imaging. Imaging report included. Please call patient today.",
    receivedOffsetMinutes: 95,
    expectedOutcome: "Today; Triage Nurse; urgency evidence preserved; no diagnosis asserted.",
  },
  {
    id: "NR-003",
    source: "paste",
    rawText:
      "Routine cardiology consult for Morgan Chen, 202-555-0103. Referring: Dr. Sam Reed. Palpitations, records and medication list attached. No urgent concerns noted.",
    receivedOffsetMinutes: 180,
    expectedOutcome: "This Week; Scheduling; complete routine referral.",
  },
  {
    id: "NR-004",
    source: "paste",
    rawText: "Need dermatology appointment. Rash getting worse. Taylor Diaz.",
    receivedOffsetMinutes: 240,
    expectedOutcome: "Needs Information; Intake; missing contact, referring clinician, and minimum records.",
  },
  {
    id: "NR-005",
    source: "paste",
    rawText:
      "Ortho referral - Riley Evans, 202-555-0105. Knee pain x 6 months. Dr. Noor Malik. Insurance card included, but no clinical note or imaging report.",
    receivedOffsetMinutes: 300,
    expectedOutcome: "Needs Information; Intake; specifically name missing clinical records.",
  },
  {
    id: "NR-006",
    source: "paste",
    rawText:
      "Post-op patient, Jamie Flores, 202-555-0106. Surgeon office says routine follow-up but note also says review today for drainage concern. Call surgeon's line 202-555-0196.",
    receivedOffsetMinutes: 360,
    expectedOutcome:
      "Today plus contradiction flag; Triage Nurse or Manual Review based on precedence; surface both phrases.",
  },
  {
    id: "NR-007",
    source: "paste",
    rawText:
      "Please schedule Avery Green, 202-555-0107, for neurology - maybe cardiology? Episodes of dizziness; referral sheet does not name a service. PCP Dr. Maya Singh.",
    receivedOffsetMinutes: 420,
    expectedOutcome: "Manual Review; Triage Lead; conflicting/ambiguous route; do not guess service.",
  },
  {
    id: "NR-008",
    source: "paste",
    rawText:
      "Routine pulmonary referral for Quinn Harper, 202-555-0108, from Dr. Leo Young. Reason, recent office note, medication list and contact details included.",
    receivedOffsetMinutes: 480,
    expectedOutcome: "This Week; Scheduling; high completeness.",
  },
  {
    id: "NR-009",
    source: "paste",
    rawText:
      "Patient Cameron Irving, 202-555-0109, declined the visit when our office called. Return to referring office. Original referral was routine endocrinology.",
    receivedOffsetMinutes: 600,
    expectedOutcome: "Declined/Closed; no scheduling queue; preserve closure reason.",
  },
];
