"use client";

import { useState } from "react";
import {
  buildDirectionalPlacement,
  directSunLevels,
  windowDirections,
  windowDistances,
  type DirectionalPlacementInput,
} from "@/lib/validation/inventory";

const directionLabels: Record<string, string> = {
  north: "North",
  east: "East",
  south: "South",
  west: "West",
  flexible: "Flexible",
};

const distanceLabels: Record<string, string> = {
  windowsill: "On the windowsill",
  within_1_3_ft: "Within 1–3 ft",
  "3_6_ft": "3–6 ft back",
  farther_with_ambient_light: "Farther, if the room is bright",
};

const sunLabels: Record<string, string> = {
  none: "No direct sun",
  gentle_morning: "Gentle morning sun",
  limited: "Limited midday sun",
  several_hours: "Several hours of direct sun",
};

export function DirectionalPlacementBuilder({ initialSentence }: { initialSentence: string }) {
  const [input, setInput] = useState<DirectionalPlacementInput>({});
  const [sentence, setSentence] = useState(initialSentence);

  function update(patch: Partial<DirectionalPlacementInput>) {
    const next = { ...input, ...patch };
    setInput(next);
    const generated = buildDirectionalPlacement(next);
    if (generated) setSentence(generated);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col text-xs text-ink-soft">
          Window direction
          <select
            className="min-h-11 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
            onChange={(event) => update({ window_direction: event.target.value as never })}
            defaultValue=""
          >
            <option value="" disabled>
              Choose…
            </option>
            {windowDirections.map((value) => (
              <option key={value} value={value}>
                {directionLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs text-ink-soft">
          Distance
          <select
            className="min-h-11 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
            onChange={(event) => update({ window_distance: event.target.value as never })}
            defaultValue=""
          >
            <option value="" disabled>
              Choose…
            </option>
            {windowDistances.map((value) => (
              <option key={value} value={value}>
                {distanceLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs text-ink-soft">
          Direct sun
          <select
            className="min-h-11 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
            onChange={(event) => update({ direct_sun: event.target.value as never })}
            defaultValue=""
          >
            <option value="" disabled>
              Choose…
            </option>
            {directSunLevels.map((value) => (
              <option key={value} value={value}>
                {sunLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs text-ink-soft">
          Seasonal note
          <input
            className="min-h-11 rounded-sm border border-line bg-cream px-2 text-sm text-ink"
            placeholder="e.g. move back in summer"
            onChange={(event) => update({ seasonal_note: event.target.value })}
          />
        </label>
      </div>

      <label className="flex flex-col text-sm text-ink">
        Directional placement (shown to visitors — edit freely)
        <textarea
          name="directional_placement"
          value={sentence}
          onChange={(event) => setSentence(event.target.value)}
          rows={3}
          className="mt-1 rounded-sm border border-line bg-cream px-3 py-2 text-ink"
        />
      </label>
    </div>
  );
}
