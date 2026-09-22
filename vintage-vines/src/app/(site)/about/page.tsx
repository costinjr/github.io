import Link from "next/link";
import type { Metadata } from "next";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";
import { PurposeBlock } from "@/components/landing/purpose-block";

export const metadata: Metadata = {
  title: "About",
  description: `${business.founder} on locally propagated houseplants, thrifted vintage vessels, and growing with purpose in ${business.location.city}, ${business.location.state}.`,
};

export default function AboutPage() {
  const copy = siteCopy.about;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">{copy.headline}</h1>
      </div>

      <div className="mt-10 flex flex-col gap-4 text-lg text-ink">
        {copy.founderStory.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p className="text-sm text-ink-soft">{copy.founderAttribution}</p>
      </div>

      <div className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl text-ink">{copy.propagation.heading}</h2>
          <p className="mt-2 text-ink-soft">{copy.propagation.body}</p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-ink">{copy.vessels.heading}</h2>
          <p className="mt-2 text-ink-soft">{copy.vessels.body}</p>
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <PurposeBlock />
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/purchase"
          className="inline-flex min-h-11 items-center rounded-sm bg-green px-5 text-sm font-medium text-cream"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
