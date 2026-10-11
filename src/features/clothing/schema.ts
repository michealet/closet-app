import { z } from "zod";
import { NAME_MAX } from "@/lib/constants";
import { Constants } from "@/types/database";

export const clothingDetailsSchema = z.object({
  name: z.string().trim().min(1, "Give your clothing a name.").max(NAME_MAX),
  category: z.enum(Constants.public.Enums.clothing_category, {
    error: "Choose a category.",
  }),
});

export const clothingSchema = clothingDetailsSchema.extend({
  itemId: z.uuid(),
  imagePath: z.string(),
  thumbnailPath: z.string(),
});
