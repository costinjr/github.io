import { notFound } from "next/navigation";
import { getReferralById } from "@/lib/referrals";
import { triageAction } from "./actions";
import { listTriageRuns } from "@/lib/triage-runs";
import { describeWorkflowEvent, listWorkflowEvents } from "@/lib/workflow";
import { NoteForm } from "./NoteForm";
import { StatusForm } from "./StatusForm";

function needsReviewReason(extractedJson: unknown): string | null {
  if (
    extractedJson &&
    typeof extractedJson === "object" &&
    "needs_review" in extractedJson &&
    (extractedJson as { needs_review?: unknown }).needs_review === true &&
    "reason" in extractedJson
  ) {
    return String((extractedJson as { reason: unknown }).reason);
  }
  return null;
}

function asEvidenceQuotes(evidenceJson: unknown): { field: string; quote: string }[] {
  if (!Array.isArray(evidenceJson)) return [];
  return evidenceJson.filter(
    (entry): entry is { field: string; quote: string } =>
      !!entry && typeof entry === "object" && "field" in entry && "quote" in entry,
  );
}

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const referral = await getReferralById(id);
  if (!referral) {
    notFound();
  }

  const [triageRuns, workflowEvents] = await Promise.all([listTriageRuns(id), listWorkflowEvents(id)]);
  const latestRun = triageRuns[0] ?? null;
  const latestReviewReason = latestRun ? needsReviewReason(latestRun.extractedJson) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Referral {referral.id}</h1>
        <p className="text-sm text-foreground/70">
          Received {new Date(referral.receivedAt).toLocaleString()} via {referral.source}
        </p>
      </div>

      {referral.priority === "Critical" ? (
        <div className="rounded-md border border-red-400/60 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-200">
          This tool does not replace emergency services.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 rounded-md border border-black/10 p-4 text-sm sm:grid-cols-3 dark:border-white/10">
        <SummaryField label="Status" value={referral.status} />
        <SummaryField label="Priority" value={referral.priority ?? "Not yet triaged"} />
        <SummaryField label="Service" value={referral.serviceRequested ?? "Unknown"} />
        <SummaryField label="Owner role" value={referral.ownerRole ?? "Unassigned"} />
        <SummaryField label="Completeness" value={referral.completeness ?? "Unknown"} />
        <SummaryField label="Due" value={referral.dueAt ? new Date(referral.dueAt).toLocaleString() : "Not set"} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Missing information</h2>
        {referral.missingFields.length === 0 ? (
          <p className="text-sm text-foreground/70">None recorded yet.</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-foreground/70">
            {referral.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Triage classification</h2>

        {latestRun && latestRun.finalPriority ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-foreground/70">
              Prompt {latestRun.promptVersion}, rules {latestRun.rulesVersion}, model {latestRun.model}, confidence{" "}
              {latestRun.confidence}.
            </p>
            <div>
              <p className="font-medium">Rule hits</p>
              <ul className="list-inside list-disc text-foreground/70">
                {(Array.isArray(latestRun.ruleHits) ? latestRun.ruleHits : []).map((hit) => (
                  <li key={String(hit)}>{String(hit)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Evidence</p>
              <ul className="list-inside list-disc text-foreground/70">
                {asEvidenceQuotes(latestRun.evidenceJson).map((quote, index) => (
                  <li key={index}>
                    <span className="font-mono text-xs">{quote.field}</span>: &ldquo;{quote.quote}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : latestReviewReason ? (
          <p className="text-sm text-foreground/70">
            Needs review: {latestReviewReason} Re-run triage below, or handle this referral manually.
          </p>
        ) : (
          <p className="text-sm text-foreground/70">Not yet triaged.</p>
        )}

        <form action={triageAction}>
          <input type="hidden" name="referralId" value={referral.id} />
          <button
            type="submit"
            className="w-fit rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
          >
            {triageRuns.length === 0 ? "Run Triage" : "Re-run Triage"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Original intake</h2>
        <pre className="whitespace-pre-wrap rounded-md border border-black/10 bg-black/[0.02] p-3 font-mono text-sm dark:border-white/10 dark:bg-white/[0.03]">
          {referral.rawText}
        </pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Update</h2>
        <StatusForm referralId={referral.id} currentStatus={referral.status} />
        <NoteForm referralId={referral.id} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Triage history</h2>
        {triageRuns.length === 0 ? (
          <p className="text-sm text-foreground/70">No triage runs yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-foreground/70">
            {triageRuns.map((run) => (
              <li key={run.id}>
                {new Date(run.createdAt).toLocaleString()} — {run.finalPriority ?? `Needs review (${needsReviewReason(run.extractedJson) ?? "unknown reason"})`}
                {run.rulesVersion ? ` — rules ${run.rulesVersion}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Workflow history</h2>
        {workflowEvents.length === 0 ? (
          <p className="text-sm text-foreground/70">No status changes or notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-foreground/70">
            {workflowEvents.map((event) => (
              <li key={event.id}>
                {new Date(event.createdAt).toLocaleString()} — {describeWorkflowEvent(event)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-foreground/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
