import type { Metadata } from "next";
import { after } from "next/server";
import { business } from "@/config/business";
import { logEvent } from "@/lib/analytics/log-event";
import { env } from "@/lib/env";
import { getInventoryItemBySlug } from "@/lib/inventory";
import { formatPriceCents } from "@/lib/format";
import { careDifficultyLabels, lightLevelLabels, petSafetyLabels, wateringLabels } from "@/lib/display-labels";
import { photoUrl } from "@/lib/storage-url";
import { PhotoGallery } from "@/components/inventory/photo-gallery";
import { PieceUnavailable } from "@/components/inventory/piece-unavailable";
import { TrackedLink } from "@/components/analytics/tracked-link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getInventoryItemBySlug(slug);
  if (!item) return { title: "Piece unavailable" };

  return {
    title: item.display_name,
    description: `${item.plant_description} — ${formatPriceCents(item.price_cents)}, ${business.tax.note}.`,
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getInventoryItemBySlug(slug);

  if (!item) return <PieceUnavailable />;

  after(() => logEvent("item_viewed", { inventoryItemId: item.id, path: `/purchase/${slug}` }));

  const sizeLabel = business.oneOfOnePricing.find((tier) => tier.sizeClass === item.size_class)?.label;
  const photos = [...item.inventory_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({
      url: photoUrl(env.NEXT_PUBLIC_SUPABASE_URL, image),
      altText: image.alt_text,
    }))
    .filter((photo): photo is { url: string; altText: string | null } => !!photo.url);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.display_name,
    description: item.plant_description,
    image: photos.map((photo) => photo.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (item.price_cents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="grid gap-10 md:grid-cols-2">
        <PhotoGallery photos={photos} alt={item.plant_common_name ?? item.plant_description} />

        <div>
          <span className="inline-block w-fit rounded-sm bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
            Available now — this is the exact piece you&apos;ll take home
          </span>

          <h1 className="mt-3 font-serif text-3xl text-ink">{item.display_name}</h1>
          <p className="mt-1 text-ink-soft">{item.plant_description}</p>

          <p className="mt-4 font-serif text-2xl text-ink">{formatPriceCents(item.price_cents)}</p>
          <p className="text-sm text-ink-soft">{business.tax.note}</p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled
              title="Online claiming opens soon"
              className="min-h-11 rounded-sm bg-green/50 px-4 text-sm font-medium text-cream"
            >
              Claim this exact piece
            </button>
            <p className="text-xs text-ink-soft">
              Online claiming opens soon — message Libby to reserve this piece in the meantime.
            </p>
            <TrackedLink
              event="contact_click"
              href={`mailto:${business.contact.email}?subject=${encodeURIComponent(
                `Question about ${item.display_name}`,
              )}`}
              className="min-h-11 rounded-sm border border-line px-4 py-2 text-center text-sm font-medium text-ink"
            >
              Ask Libby a question
            </TrackedLink>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {item.plant_common_name && (
              <>
                <dt className="text-ink-soft">Plant</dt>
                <dd className="text-ink">
                  {item.plant_common_name}
                  {item.plant_botanical_name && (
                    <span className="italic text-ink-soft"> ({item.plant_botanical_name})</span>
                  )}
                </dd>
              </>
            )}
            {item.vessel_name && (
              <>
                <dt className="text-ink-soft">Vessel</dt>
                <dd className="text-ink">{item.vessel_name}</dd>
              </>
            )}
            <dt className="text-ink-soft">Light</dt>
            <dd className="text-ink">{item.light_levels.map((l) => lightLevelLabels[l]).join(", ")}</dd>
            {item.watering && (
              <>
                <dt className="text-ink-soft">Watering</dt>
                <dd className="text-ink">{wateringLabels[item.watering]}</dd>
              </>
            )}
            <dt className="text-ink-soft">Care</dt>
            <dd className="text-ink">{careDifficultyLabels[item.care_difficulty]}</dd>
            <dt className="text-ink-soft">Pet safety</dt>
            <dd className="text-ink">{petSafetyLabels[item.pet_safety]}</dd>
            {sizeLabel && (
              <>
                <dt className="text-ink-soft">Size</dt>
                <dd className="text-ink">{sizeLabel}</dd>
              </>
            )}
            {(item.dimensions_height_in || item.dimensions_width_in) && (
              <>
                <dt className="text-ink-soft">Dimensions</dt>
                <dd className="text-ink">
                  {item.dimensions_height_in ? `${item.dimensions_height_in}"H` : ""}
                  {item.dimensions_height_in && item.dimensions_width_in ? " × " : ""}
                  {item.dimensions_width_in ? `${item.dimensions_width_in}"W` : ""}
                </dd>
              </>
            )}
          </dl>

          {item.directional_placement && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Where it likes to live
              </p>
              <p className="mt-1 text-sm text-ink">{item.directional_placement}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-8 border-t border-line pt-8 text-sm text-ink-soft sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Packaging</p>
          <p className="mt-1">Every piece comes with a {business.packaging.description}.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Fulfillment</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {business.fulfillment.deliveryTiers.map((tier) => (
              <li key={tier.label}>{tier.label}</li>
            ))}
            <li>{business.fulfillment.beyondMaxMilesNote}</li>
            <li>{business.fulfillment.pickupNote}</li>
          </ul>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Returns</p>
          <p className="mt-1">{business.returns.policy}</p>
        </div>
      </div>
    </div>
  );
}
