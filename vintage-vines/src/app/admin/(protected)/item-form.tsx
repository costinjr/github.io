"use client";

import { useActionState, useState } from "react";
import { business } from "@/config/business";
import {
  careDifficulties,
  lightLevels as lightLevelOptions,
  petSafetyValues,
  vesselMaterials,
  waterings,
} from "@/lib/validation/inventory";
import type { ItemFormState } from "@/lib/actions/admin-items";
import type { AdminInventoryItem } from "@/lib/admin-inventory";
import { PhotoDropzone } from "./photo-dropzone";
import { ExistingPhotos } from "./existing-photos";
import { DirectionalPlacementBuilder } from "./directional-placement-builder";
import { MAX_PHOTOS_PER_ITEM } from "@/lib/upload-limits";

type ItemAction = (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;

export function ItemForm({
  action,
  item,
  existingPhotos,
}: {
  action: ItemAction;
  item?: AdminInventoryItem;
  existingPhotos?: { id: string; url: string | null; isCover: boolean }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [sizeClass, setSizeClass] = useState(item?.size_class ?? "small");

  const tier = business.oneOfOnePricing.find((t) => t.sizeClass === sizeClass);
  const petSafetyDataProvided = business.petSafety.dataProvided;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {item && <input type="hidden" name="id" value={item.id} />}

      {state.error && (
        <p role="alert" className="rounded-sm border border-terracotta bg-paper p-3 text-sm text-terracotta">
          {state.error}
        </p>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">The basics</legend>

        <label className="flex flex-col text-sm text-ink">
          Fun individual name
          <input
            name="display_name"
            defaultValue={item?.display_name}
            placeholder="Betty"
            required
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
          <FieldError name="display_name" state={state} />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Plain plant-and-vessel description
          <input
            name="plant_description"
            defaultValue={item?.plant_description}
            placeholder="Snake plant in brass tumbler"
            required
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
          <FieldError name="plant_description" state={state} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Size and price</legend>
        <div className="flex gap-4">
          <label className="flex flex-col text-sm text-ink">
            Size
            <select
              name="size_class"
              value={sizeClass}
              onChange={(event) => setSizeClass(event.target.value as typeof sizeClass)}
              className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
            >
              {business.oneOfOnePricing.map((t) => (
                <option key={t.sizeClass} value={t.sizeClass}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-ink">
            Price in cents ({business.tax.note})
            <input
              name="price_cents"
              type="number"
              min={1}
              defaultValue={item?.price_cents ?? tier?.priceCents}
              key={sizeClass}
              required
              className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
            />
            <FieldError name="price_cents" state={state} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Care</legend>

        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-ink">Light levels this plant tolerates</legend>
          <div className="flex gap-4">
            {lightLevelOptions.map((level) => (
              <label key={level} className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  name="light_levels"
                  value={level}
                  defaultChecked={item?.light_levels.includes(level)}
                />
                {level}
              </label>
            ))}
          </div>
          <FieldError name="light_levels" state={state} />
        </fieldset>

        <label className="flex flex-col text-sm text-ink">
          Care difficulty
          <select
            name="care_difficulty"
            defaultValue={item?.care_difficulty}
            required
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          >
            <option value="" disabled>
              Choose…
            </option>
            {careDifficulties.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldError name="care_difficulty" state={state} />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Pet safety
          <select
            name="pet_safety"
            defaultValue={item?.pet_safety ?? "unknown"}
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          >
            {petSafetyValues.map((value) => (
              <option key={value} value={value} disabled={!petSafetyDataProvided && value !== "unknown"}>
                {value}
              </option>
            ))}
          </select>
          {!petSafetyDataProvided && (
            <span className="mt-1 text-xs text-ink-soft">
              Libby hasn&apos;t supplied per-plant pet-safety data yet — every piece stays
              &quot;unknown&quot; until she does.
            </span>
          )}
        </label>

        <label className="flex flex-col text-sm text-ink">
          Watering
          <select
            name="watering"
            defaultValue={item?.watering ?? ""}
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          >
            <option value="" disabled>
              Choose… (required to publish)
            </option>
            {waterings.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldError name="watering" state={state} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Plant and vessel details</legend>

        <label className="flex flex-col text-sm text-ink">
          Plant common name
          <input
            name="plant_common_name"
            defaultValue={item?.plant_common_name ?? ""}
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
          <FieldError name="plant_common_name" state={state} />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Plant botanical name (optional)
          <input
            name="plant_botanical_name"
            defaultValue={item?.plant_botanical_name ?? ""}
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Vessel name
          <input
            name="vessel_name"
            defaultValue={item?.vessel_name ?? ""}
            placeholder="Brass etched tumbler"
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
          <FieldError name="vessel_name" state={state} />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Vessel material
          <select
            name="vessel_material"
            defaultValue={item?.vessel_material ?? ""}
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          >
            <option value="" disabled>
              Choose… (required to publish)
            </option>
            {vesselMaterials.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldError name="vessel_material" state={state} />
        </label>

        <label className="flex flex-col text-sm text-ink">
          Vessel style tags (comma separated)
          <input
            name="vessel_style_tags"
            defaultValue={item?.vessel_style_tags.join(", ") ?? ""}
            placeholder="brass, minimal"
            className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
          />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col text-sm text-ink">
            Height (in)
            <input
              name="dimensions_height_in"
              type="number"
              step="0.1"
              defaultValue={item?.dimensions_height_in ?? ""}
              className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
            />
          </label>
          <label className="flex flex-col text-sm text-ink">
            Width (in)
            <input
              name="dimensions_width_in"
              type="number"
              step="0.1"
              defaultValue={item?.dimensions_width_in ?? ""}
              className="mt-1 min-h-11 rounded-sm border border-line bg-cream px-3 text-ink"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Directional placement</legend>
        <DirectionalPlacementBuilder initialSentence={item?.directional_placement ?? ""} />
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="featured" defaultChecked={item?.featured} />
        Featured (small scoring boost in the plant matchmaker)
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-ink">Photos</legend>
        {existingPhotos && <ExistingPhotos itemId={item!.id} photos={existingPhotos} />}
        <PhotoDropzone maxPhotos={MAX_PHOTOS_PER_ITEM} />
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="min-h-11 rounded-sm border border-green px-4 text-sm font-medium text-green disabled:opacity-60"
        >
          Save as draft
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          className="min-h-11 rounded-sm bg-green px-4 text-sm font-medium text-cream disabled:opacity-60"
        >
          Publish
        </button>
      </div>
    </form>
  );
}

function FieldError({ name, state }: { name: string; state: ItemFormState }) {
  const errors = state.fieldErrors?.[name];
  if (!errors?.length) return null;
  return (
    <span role="alert" className="mt-1 text-xs text-terracotta">
      {errors.join(" ")}
    </span>
  );
}
