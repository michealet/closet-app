import { z } from "zod";
import { NAME_MAX, NOTES_MAX } from "@/lib/constants";
import { Constants } from "@/types/database";

/** Most pieces one outfit can hold; far more than fits on the canvas. */
export const OUTFIT_ITEMS_MAX = 40;

const share = z.number().min(0).max(1);

/** The Save form (OC-9). */
export const outfitDetailsSchema = z.object({
  name: z
    .string({ error: "Give your outfit a name." })
    .trim()
    .min(1, "Give your outfit a name.")
    .max(NAME_MAX, `Use at most ${NAME_MAX} characters.`),
  occasion: z
    .enum(Constants.public.Enums.occasion)
    .nullish()
    .catch(null)
    .transform((value) => value ?? null),
  seasons: z
    .array(z.enum(Constants.public.Enums.season))
    .max(Constants.public.Enums.season.length)
    .default([])
    .transform((values) => [...new Set(values)]),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX)
    .nullish()
    .transform((value) => value || null),
  isFavorite: z.boolean().default(false),
});

/** What saveOutfit receives: the details, the canvas and the thumbnail (OC-10). */
export const outfitSchema = outfitDetailsSchema.extend({
  outfitId: z.uuid(),
  /** Null when the thumbnail couldn't be made; the outfit still saves. */
  thumbnailPath: z.string().nullable(),
  items: z
    .array(
      z.object({
        id: z.uuid(),
        x: share,
        y: share,
        width: z.number().gt(0).max(1),
        z: z.number().int().min(0),
      }),
    )
    .min(1, "Add at least one piece to your outfit.")
    .max(OUTFIT_ITEMS_MAX)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      "Each piece can be on the outfit once.",
    ),
});
