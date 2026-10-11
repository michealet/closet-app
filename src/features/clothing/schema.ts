import { z } from "zod";
import {
  BRAND_MAX,
  NAME_MAX,
  NOTES_MAX,
  TAG_MAX,
  TAGS_MAX,
} from "@/lib/constants";
import { Constants } from "@/types/database";
import { normalizeTag, suggestName } from "./labels";

export const clothingDetailsSchema = z.object({
  // Optional: an empty name is made from the details (#36, see withName).
  name: z
    .string()
    .trim()
    .max(NAME_MAX)
    .nullish()
    .transform((value) => value || null),
  category: z.enum(Constants.public.Enums.clothing_category, {
    error: "Choose a category.",
  }),
  brand: z
    .string()
    .trim()
    .max(BRAND_MAX)
    .nullish()
    .transform((value) => value || null),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX)
    .nullish()
    .transform((value) => value || null),
  colors: z
    .array(z.enum(Constants.public.Enums.clothing_color))
    .max(Constants.public.Enums.clothing_color.length)
    .default([])
    .transform((values) => [...new Set(values)]),
  seasons: z
    .array(z.enum(Constants.public.Enums.season))
    .max(Constants.public.Enums.season.length)
    .default([])
    .transform((values) => [...new Set(values)]),
  tags: z
    .array(
      z
        .string()
        .transform(normalizeTag)
        .pipe(
          z
            .string()
            .min(1)
            .max(TAG_MAX, `Tags are at most ${TAG_MAX} characters.`),
        ),
    )
    .default([])
    .transform((values) => [...new Set(values)])
    .pipe(z.array(z.string()).max(TAGS_MAX, `Use at most ${TAGS_MAX} tags.`)),
});

/** The details to save, with a generated name when none was typed. */
export function withName<T extends z.output<typeof clothingDetailsSchema>>(
  details: T,
): Omit<T, "name"> & { name: string } {
  return { ...details, name: details.name ?? suggestName(details) };
}

export const clothingSchema = clothingDetailsSchema.extend({
  itemId: z.uuid(),
  imagePath: z.string(),
  thumbnailPath: z.string(),
});

/** Edit (AC-10): a replaced photo sends both new paths, or neither. */
export const clothingUpdateSchema = clothingDetailsSchema
  .extend({
    itemId: z.uuid(),
    imagePath: z.string().optional(),
    thumbnailPath: z.string().optional(),
  })
  .refine(
    ({ imagePath, thumbnailPath }) =>
      (imagePath === undefined) === (thumbnailPath === undefined),
    "Upload a photo for this item again.",
  );

export const favoriteSchema = z.object({
  id: z.uuid(),
  isFavorite: z.boolean(),
});
