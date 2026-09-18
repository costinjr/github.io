import { notFound } from "next/navigation";
import { getReferralById } from "@/lib/referrals";
import { listTriageRuns } from "@/lib/triage-runs";
import { describeWorkflowEvent, listWorkflowEvents } from "@/lib/workflow";
import { NoteForm } from "./NoteForm";
import { StatusForm } from "./StatusForm";

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Referral {referral.id}</h1>
        <p className="text-sm text-foreground/70">
          Received {new Date(referral.receivedAt).toLocaleString()} via {referral.source}
        </p>
      </div>

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

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Triage classification</h2>
        {latestRun ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="text-foreground/70">
              Prompt {latestRun.promptVersion ?? "unknown"}, rules {latestRun.rulesVersion ?? "unknown"}, model{" "}
              {latestRun.model ?? "unknown"}.
            </p>
            <p>Rule hits: {latestRun.ruleHits ? JSON.stringify(latestRun.ruleHits) : "none"}</p>
            <p>Evidence: {latestRun.evidenceJson ? JSON.stringify(latestRun.evidenceJson) : "none"}</p>
          </div>
        ) : (
          <p className="text-sm text-foreground/70">Not yet triaged. The extraction pipeline lands in a later session.</p>
        )}
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
                {new Date(run.createdAt).toLocaleString()} — prompt {run.promptVersion ?? "unknown"}, rules{" "}
                {run.rulesVersion ?? "unknown"}
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
