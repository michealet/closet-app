"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALL_SEASONS,
  BRAND_MAX,
  COLOR_OPTIONS,
  NOTES_MAX,
  SEASON_OPTIONS,
  type ClothingColor,
  type Season,
} from "@/lib/constants";
import { TagInput } from "./tag-input";

export type OptionalDefaults = {
  brand: string | null;
  notes: string | null;
  colors: ClothingColor[];
  seasons: Season[];
  tags: string[];
};

export function ClothingOptionalFields({
  brands,
  tags = [],
  defaults,
}: {
  brands: string[];
  tags?: string[];
  defaults?: OptionalDefaults;
}) {
  const [seasons, setSeasons] = useState<Season[]>(defaults?.seasons ?? []);
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="brand">Brand (optional)</Label>
        <Input
          id="brand"
          name="brand"
          list="brands"
          maxLength={BRAND_MAX}
          defaultValue={defaults?.brand ?? ""}
        />
        <datalist id="brands">
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </datalist>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Colors (optional)</legend>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_OPTIONS.map(({ value, label, swatch }) => (
            <Label
              key={value}
              className="min-h-11 rounded-lg border border-input px-3"
            >
              <input
                type="checkbox"
                name="colors"
                value={value}
                defaultChecked={defaults?.colors.includes(value)}
                className="size-4"
              />
              <span
                aria-hidden
                className="flex size-5 items-center justify-center rounded-full border border-border bg-muted"
                style={{ backgroundColor: swatch ?? undefined }}
              >
                {swatch ? null : "⋯"}
              </span>
              {label}
            </Label>
          ))}
        </div>
      </fieldset>
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
      <TagInput defaultTags={defaults?.tags} suggestions={tags} />
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          maxLength={NOTES_MAX}
          rows={3}
          defaultValue={defaults?.notes ?? ""}
          className="w-full rounded-lg border border-input bg-background p-3 text-base focus-visible:outline-ring"
        />
        <p className="text-sm text-muted-foreground">
          Up to {NOTES_MAX} characters.
        </p>
      </div>
    </>
  );
}
