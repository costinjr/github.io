"use client";

import { useMemo, useState } from "react";
import { business } from "@/config/business";
import { careDifficultyLabels, lightLevelLabels } from "@/lib/display-labels";
import type { InventoryItemWithImages } from "@/lib/inventory";
import type { CareDifficulty, LightLevel, SizeClass } from "@/types/database";
import { ItemCard } from "./item-card";

interface Filters {
  light: Set<LightLevel>;
  care: Set<CareDifficulty>;
  size: Set<SizeClass>;
  vesselStyle: Set<string>;
  petFriendlyOnly: boolean;
  maxPriceCents: number | null;
}

const emptyFilters: Filters = {
  light: new Set(),
  care: new Set(),
  size: new Set(),
  vesselStyle: new Set(),
  petFriendlyOnly: false,
  maxPriceCents: null,
};

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function InventoryGrid({
  items,
  showFilters = true,
}: {
  items: InventoryItemWithImages[];
  showFilters?: boolean;
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const availableLight = useMemo(
    () => [...new Set(items.flatMap((item) => item.light_levels))],
    [items],
  );
  const availableCare = useMemo(
    () => [...new Set(items.map((item) => item.care_difficulty))],
    [items],
  );
  const availableSizes = useMemo(
    () => [...new Set(items.map((item) => item.size_class))],
    [items],
  );
  const availableVesselStyles = useMemo(
    () => [...new Set(items.flatMap((item) => item.vessel_style_tags))].sort(),
    [items],
  );
  const showPetFilter = business.petSafety.dataProvided;

  const filtered = items.filter((item) => {
    if (filters.light.size > 0 && !item.light_levels.some((l) => filters.light.has(l))) {
      return false;
    }
    if (filters.care.size > 0 && !filters.care.has(item.care_difficulty)) return false;
    if (filters.size.size > 0 && !filters.size.has(item.size_class)) return false;
    if (
      filters.vesselStyle.size > 0 &&
      !item.vessel_style_tags.some((tag) => filters.vesselStyle.has(tag))
    ) {
      return false;
    }
    if (filters.petFriendlyOnly && item.pet_safety !== "pet_safe") return false;
    if (filters.maxPriceCents !== null && item.price_cents > filters.maxPriceCents) return false;
    return true;
  });

  const hasActiveFilters =
    filters.light.size > 0 ||
    filters.care.size > 0 ||
    filters.size.size > 0 ||
    filters.vesselStyle.size > 0 ||
    filters.petFriendlyOnly ||
    filters.maxPriceCents !== null;

  return (
    <div>
      {showFilters && (
        <div className="mb-6 flex flex-wrap gap-6 border-b border-line pb-6">
          {availableLight.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Light
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableLight.map((level) => (
                  <label key={level} className="flex items-center gap-1 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={filters.light.has(level)}
                      onChange={() =>
                        setFilters((f) => ({ ...f, light: toggle(f.light, level) }))
                      }
                    />
                    {lightLevelLabels[level]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {availableCare.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Care level
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableCare.map((level) => (
                  <label key={level} className="flex items-center gap-1 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={filters.care.has(level)}
                      onChange={() => setFilters((f) => ({ ...f, care: toggle(f.care, level) }))}
                    />
                    {careDifficultyLabels[level]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {availableSizes.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Size
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const label = business.oneOfOnePricing.find((t) => t.sizeClass === size)?.label ?? size;
                  return (
                    <label key={size} className="flex items-center gap-1 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={filters.size.has(size)}
                        onChange={() => setFilters((f) => ({ ...f, size: toggle(f.size, size) }))}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {availableVesselStyles.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Vessel style
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableVesselStyles.map((style) => (
                  <label key={style} className="flex items-center gap-1 text-sm capitalize text-ink">
                    <input
                      type="checkbox"
                      checked={filters.vesselStyle.has(style)}
                      onChange={() =>
                        setFilters((f) => ({ ...f, vesselStyle: toggle(f.vesselStyle, style) }))
                      }
                    />
                    {style}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {showPetFilter && (
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Pets
              </legend>
              <label className="mt-2 flex items-center gap-1 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={filters.petFriendlyOnly}
                  onChange={() =>
                    setFilters((f) => ({ ...f, petFriendlyOnly: !f.petFriendlyOnly }))
                  }
                />
                Pet friendly only
              </label>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Price
            </legend>
            <label className="mt-2 flex items-center gap-2 text-sm text-ink">
              Up to $
              <input
                type="number"
                min={1}
                placeholder="Any"
                className="w-20 rounded-sm border border-line bg-cream px-2 py-1"
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters((f) => ({
                    ...f,
                    maxPriceCents: value ? Number(value) * 100 : null,
                  }));
                }}
              />
            </label>
          </fieldset>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="self-end text-sm text-terracotta underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-ink-soft">
          Nothing matches those filters right now — try clearing one.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
