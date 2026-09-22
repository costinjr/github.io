import Link from "next/link";
import { business } from "@/config/business";
import { routes } from "@/config/routes";

// Exact copy from section 9, "Public inventory page at launch" —
// reused wherever the public catalog is empty so the site never shows a
// broken grid, only this intentional, on-brand state.
export function EmptyInventoryState() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h2 className="text-2xl text-ink">Fresh pieces are taking root.</h2>
      <p className="mt-2 text-ink-soft">
        The first Vintage Vines collection will appear here soon.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={`mailto:${business.contact.email}`}
          className="inline-flex min-h-11 items-center rounded-sm border border-green px-4 text-sm font-medium text-green"
        >
          Tell Libby what you&apos;re looking for
        </a>
        <a
          href={business.contact.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink"
        >
          Follow on Instagram
        </a>
        <Link
          href={routes.realtors.path}
          className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink"
        >
          Learn about realtor gifts
        </Link>
      </div>
    </div>
  );
}
