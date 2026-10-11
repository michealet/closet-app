import { z } from "zod";
import { BRAND_MAX, NAME_MAX, NOTES_MAX } from "@/lib/constants";
import { Constants } from "@/types/database";

export const clothingDetailsSchema = z.object({
  name: z.string().trim().min(1, "Give your clothing a name.").max(NAME_MAX),
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
});

export const clothingSchema = clothingDetailsSchema.extend({
  itemId: z.uuid(),
  imagePath: z.string(),
  thumbnailPath: z.string(),
});
