"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ALL_SEASONS, SEASON_OPTIONS, type Season } from "@/lib/constants";

/** Season checkboxes (`name="seasons"`) with an "All Season" shortcut. */
export function SeasonFields({ defaults = [] }: { defaults?: Season[] }) {
  const [seasons, setSeasons] = useState<Season[]>(defaults);
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Seasons (optional)</legend>
      <Label className="min-h-11 gap-2">
        <input
          type="checkbox"
          className="size-4"
          checked={seasons.length === ALL_SEASONS.length}
          onChange={(event) =>
            setSeasons(event.target.checked ? [...ALL_SEASONS] : [])
          }
        />
        All Season
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {SEASON_OPTIONS.map(({ value, label }) => (
          <Label
            key={value}
            className="min-h-11 rounded-lg border border-input px-3"
          >
            <input
              type="checkbox"
              name="seasons"
              value={value}
              className="size-4"
              checked={seasons.includes(value)}
              onChange={(event) =>
                setSeasons((selected) =>
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((season) => season !== value),
                )
              }
            />
            {label}
          </Label>
        ))}
      </div>
    </fieldset>
  );
}
