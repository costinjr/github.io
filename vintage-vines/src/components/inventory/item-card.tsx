import Image from "next/image";
import Link from "next/link";
import { business } from "@/config/business";
import { careDifficultyLabels, lightLevelLabels, petSafetyLabels } from "@/lib/display-labels";
import { formatPriceCents } from "@/lib/format";
import { coverPhotoUrl } from "@/lib/storage-url";
import { env } from "@/lib/env";
import type { InventoryItemWithImages } from "@/lib/inventory";

export function ItemCard({ item }: { item: InventoryItemWithImages }) {
  const coverUrl = coverPhotoUrl(env.NEXT_PUBLIC_SUPABASE_URL, item.inventory_images);
  const sizeLabel = business.oneOfOnePricing.find((tier) => tier.sizeClass === item.size_class)?.label;

  return (
    <li className="flex flex-col overflow-hidden rounded-sm border border-line bg-paper">
      <Link href={`/purchase/${item.slug}`} className="block">
        <div className="aspect-square w-full overflow-hidden bg-cream-deep">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={item.plant_common_name ?? item.plant_description}
              width={480}
              height={480}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">
              Photo coming soon
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-block w-fit rounded-sm bg-green/10 px-2 py-0.5 text-xs font-medium text-green">
          Available now
        </span>

        <Link href={`/purchase/${item.slug}`}>
          <h3 className="font-serif text-xl text-ink">{item.display_name}</h3>
        </Link>
        <p className="text-sm text-ink-soft">{item.plant_description}</p>

        <div className="flex flex-wrap gap-1 text-xs text-ink-soft">
          {item.light_levels.map((level) => (
            <span key={level} className="rounded-sm border border-line px-2 py-0.5">
              {lightLevelLabels[level]}
            </span>
          ))}
          <span className="rounded-sm border border-line px-2 py-0.5">
            {careDifficultyLabels[item.care_difficulty]}
          </span>
          <span className="rounded-sm border border-line px-2 py-0.5">
            {petSafetyLabels[item.pet_safety]}
          </span>
          {sizeLabel && (
            <span className="rounded-sm border border-line px-2 py-0.5">{sizeLabel}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <p className="font-serif text-lg text-ink">{formatPriceCents(item.price_cents)}</p>
            <p className="text-xs text-ink-soft">{business.tax.note}</p>
          </div>
          <Link
            href={`/purchase/${item.slug}`}
            className="inline-flex min-h-11 items-center rounded-sm bg-green px-4 text-sm font-medium text-cream"
          >
            Claim this exact piece
          </Link>
        </div>
      </div>
    </li>
  );
}
