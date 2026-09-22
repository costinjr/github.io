import Link from "next/link";
import { business } from "@/config/business";

export function PieceUnavailable() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl text-ink">This piece has found its home.</h1>
      <p className="mt-2 text-ink-soft">
        It&apos;s no longer available — but the collection keeps growing.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/purchase"
          className="inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
        >
          See what&apos;s available
        </Link>
        <a
          href={business.contact.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink"
        >
          Follow on Instagram
        </a>
      </div>
    </div>
  );
}
