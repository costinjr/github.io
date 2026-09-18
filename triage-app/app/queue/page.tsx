import Link from "next/link";
import { listReferrals } from "@/lib/referrals";
import {
  QUEUE_BANDS,
  distinctServices,
  filterReferrals,
  formatAge,
  groupByBand,
  parseQueueFilters,
  reasonForReferral,
} from "@/lib/queue";
import { OWNER_ROLES, REFERRAL_PRIORITIES, REFERRAL_STATUSES } from "@/lib/types";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const filters = parseQueueFilters(rawSearchParams);
  const allReferrals = await listReferrals();
  const filtered = filterReferrals(allReferrals, filters);
  const groups = groupByBand(filtered);
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Queue</h1>
        <p className="text-sm text-foreground/70">
          {allReferrals.length} total referral{allReferrals.length === 1 ? "" : "s"}
          {hasActiveFilters ? `, ${filtered.length} matching the current filters` : ""}.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3 border-b border-black/10 pb-6 dark:border-white/10">
        <FilterSelect name="status" label="Status" options={REFERRAL_STATUSES} value={filters.status} />
        <FilterSelect name="priority" label="Priority" options={REFERRAL_PRIORITIES} value={filters.priority} />
        <FilterSelect name="ownerRole" label="Owner role" options={OWNER_ROLES} value={filters.ownerRole} />
        <FilterSelect
          name="service"
          label="Service"
          options={distinctServices(allReferrals)}
          value={filters.service}
        />
        <button
          type="submit"
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          Filter
        </button>
        {hasActiveFilters ? (
          <Link href="/queue" className="text-sm text-foreground/70 underline underline-offset-2">
            Clear filters
          </Link>
        ) : null}
      </form>

      {allReferrals.length === 0 ? (
        <p className="text-sm text-foreground/70">
          No referrals yet. Seed the demo data by sending a POST request to{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">/api/demo/reset</code>.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-foreground/70">No referrals match these filters.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {QUEUE_BANDS.map((band) => (
            <section key={band} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">
                {band} <span className="text-sm font-normal text-foreground/50">({groups[band].length})</span>
              </h2>
              {band === "Critical" && groups[band].length > 0 ? (
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  This tool does not replace emergency services.
                </p>
              ) : null}
              {groups[band].length === 0 ? (
                <p className="text-sm text-foreground/50">No referrals in this band.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-foreground/50">
                      <tr className="border-b border-black/10 dark:border-white/10">
                        <th className="py-2 pr-4 font-medium">Referral</th>
                        <th className="py-2 pr-4 font-medium">Age</th>
                        <th className="py-2 pr-4 font-medium">Service</th>
                        <th className="py-2 pr-4 font-medium">Completeness</th>
                        <th className="py-2 pr-4 font-medium">Owner role</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups[band].map((referral) => (
                        <tr key={referral.id} className="border-b border-black/5 dark:border-white/5">
                          <td className="py-2 pr-4">
                            <Link href={`/referrals/${referral.id}`} className="font-medium underline underline-offset-2">
                              {referral.id}
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{formatAge(referral.receivedAt)}</td>
                          <td className="py-2 pr-4">{referral.serviceRequested ?? "Unknown"}</td>
                          <td className="py-2 pr-4">{referral.completeness ?? "Unknown"}</td>
                          <td className="py-2 pr-4">{referral.ownerRole ?? "Unassigned"}</td>
                          <td className="py-2 pr-4">{referral.status}</td>
                          <td className="py-2 pr-4 text-foreground/70">{reasonForReferral(referral)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
