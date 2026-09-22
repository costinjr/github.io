import type { Metadata } from "next";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";

export const metadata: Metadata = {
  title: "For Shops",
  description: siteCopy.shops.intro,
};

export default function ShopsPage() {
  const copy = siteCopy.shops;

  const mailHref = `mailto:${business.contact.email}?subject=${encodeURIComponent(
    copy.mailSubject,
  )}&body=${encodeURIComponent(
    "Hi Libby,\n\nI'd love to talk about a display of Vintage Vines pieces in our shop. A bit about us:\n",
  )}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
        {copy.eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{copy.headline}</h1>
      <p className="mx-auto mt-3 max-w-xl text-ink-soft">{copy.intro}</p>

      <div className="mt-8 inline-block rounded-sm border border-line bg-paper px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Terms</p>
        <p className="mt-1 text-ink">{business.shops.termsNote}</p>
      </div>

      <div className="mt-10">
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
