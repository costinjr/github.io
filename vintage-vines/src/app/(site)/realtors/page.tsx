import type { Metadata } from "next";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";
import { formatPriceCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "For Realtors",
  description: siteCopy.realtors.intro,
};

export default function RealtorsPage() {
  const copy = siteCopy.realtors;
  const { realtors, tax } = business;

  const mailHref = `mailto:${business.contact.email}?subject=${encodeURIComponent(
    copy.mailSubject,
  )}&body=${encodeURIComponent(
    "Hi Libby,\n\nI'd like to order closing gifts. Here are the details:\n- Quantity:\n- Closing date:\n- Delivery or Upper Arlington pickup:\n",
  )}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{copy.headline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">{copy.intro}</p>
      </div>

      <div className="mt-10 grid gap-6 rounded-sm border border-line bg-paper p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Signature closing gift
          </p>
          <p className="mt-1 font-serif text-2xl text-ink">
            {formatPriceCents(realtors.signatureGiftPriceCents)} each
          </p>
          <p className="text-xs text-ink-soft">{tax.note}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Volume orders
          </p>
          <p className="mt-1 font-serif text-2xl text-ink">
            {formatPriceCents(realtors.volumePriceCents)} each
          </p>
          <p className="text-xs text-ink-soft">
            For {realtors.volumeMinimumQuantity} or more, {tax.note.toLowerCase()}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Lead time</p>
          <p className="mt-1 text-ink">
            {realtors.leadTimeDays.min} to {realtors.leadTimeDays.max} days
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Fulfillment</p>
          <p className="mt-1 text-ink">{realtors.fulfillment}</p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <a
          href={mailHref}
          className="inline-flex min-h-11 items-center rounded-sm bg-green px-6 text-sm font-medium text-cream"
        >
          {copy.ctaLabel}
        </a>
        <p className="mt-2 text-xs text-ink-soft">
          Opens an email to {business.contact.email} — or call {business.contact.phone}.
        </p>
      </div>
    </div>
  );
}
