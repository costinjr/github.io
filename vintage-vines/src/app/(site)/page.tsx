import Link from "next/link";
import type { Metadata } from "next";
import { business } from "@/config/business";
import { siteCopy } from "@/config/site-copy";
import { getLandingInventory } from "@/lib/inventory";
import { ItemCard } from "@/components/inventory/item-card";
import { MatchmakerTeaser } from "@/components/landing/matchmaker-teaser";
import { PurposeBlock } from "@/components/landing/purpose-block";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteCopy.landing.hero.headline,
  description: siteCopy.landing.hero.body,
};

export default async function HomePage() {
  const items = await getLandingInventory(6);
  const { hero, howItWorks, waysToWorkWithUs, founderNote } = siteCopy.landing;

  return (
    <div>
      {/* Section 2 calls for "the supplied brass tumbler and cottage
          teapot grouping" as the hero photo, but that file was never
          actually provided to this build — this is a palette-only
          placeholder, not a broken image reference. Once the real photo
          exists, drop it at public/hero-brass-tumbler-teapot.jpg and
          render it here with next/image (fill + object-cover) behind
          this section's copy. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-deep to-cream">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">
            {hero.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">{hero.headline}</h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">{hero.body}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#matchmaker"
              className="inline-flex min-h-11 items-center rounded-sm bg-green px-5 text-sm font-medium text-cream"
            >
              Find my plant
            </a>
            <Link
              href="/purchase"
              className="inline-flex min-h-11 items-center rounded-sm border border-green px-5 text-sm font-medium text-green"
            >
              See available pieces
            </Link>
          </div>
        </div>
      </section>

      {/* Plant matchmaker */}
      <section className="px-4 py-16 sm:px-6">
        <MatchmakerTeaser />
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-cream-deep px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-brass">
                Step {index + 1}
              </p>
              <h3 className="mt-2 font-serif text-lg text-ink">{step.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Available now */}
      {items.length > 0 && (
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-serif text-2xl text-ink">Available now</h2>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </ul>
            <div className="mt-8 text-center">
              <Link href="/purchase" className="text-sm font-medium text-green underline">
                See everything available
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Two ways to work with us */}
      <section className="border-y border-line bg-cream-deep px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-serif text-2xl text-ink">
            {waysToWorkWithUs.heading}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-sm border border-line bg-paper p-6">
              <h3 className="font-serif text-xl text-ink">{waysToWorkWithUs.realtorCard.heading}</h3>
              <p className="mt-2 text-sm text-ink-soft">{waysToWorkWithUs.realtorCard.body}</p>
              <Link
                href="/realtors"
                className="mt-4 inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
              >
                {waysToWorkWithUs.realtorCard.cta}
              </Link>
            </div>
            <div className="rounded-sm border border-line bg-paper p-6">
              <h3 className="font-serif text-xl text-ink">{waysToWorkWithUs.shopCard.heading}</h3>
              <p className="mt-2 text-sm text-ink-soft">{waysToWorkWithUs.shopCard.body}</p>
              <Link
                href="/shops"
                className="mt-4 inline-flex min-h-11 items-center rounded-sm border border-green px-4 text-sm font-medium text-green"
              >
                {waysToWorkWithUs.shopCard.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grown with Purpose */}
      <section className="px-4 py-16 sm:px-6">
        <PurposeBlock />
      </section>

      {/* Founder note */}
      <section className="border-t border-line bg-cream-deep px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl text-ink">{founderNote.heading}</h2>
          <p className="mt-3 italic text-ink-soft">&ldquo;{founderNote.teaser}&rdquo;</p>
          <p className="mt-2 text-sm text-ink-soft">— {business.founder}</p>
          <Link href="/about" className="mt-4 inline-block text-sm font-medium text-green underline">
            {founderNote.cta}
          </Link>
        </div>
      </section>
    </div>
  );
}
