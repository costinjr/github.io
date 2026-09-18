import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-16">
      <div className="rounded-md border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
        Synthetic demo only — do not enter real patient information.
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Company Intake Triage Tool</h1>
        <p className="max-w-2xl text-sm text-foreground/70">
          Paste a messy inbound referral or fill out the structured form. The
          tool extracts the facts, checks completeness, and — using Northstar
          Specialty Clinic&apos;s written rules, not the model — assigns
          priority, owner, and due time.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/intake"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Start an intake
        </Link>
        <Link
          href="/queue"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          View queue
        </Link>
      </div>
    </main>
  );
}
