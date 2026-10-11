"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { isItemImagePath } from "@/lib/images/paths";
import { createClient } from "@/lib/supabase/server";
import { clothingSchema } from "./schema";

export async function addClothing(input: unknown): Promise<ActionState> {
  const parsed = clothingSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to save your clothing." };

  const { itemId, imagePath, thumbnailPath, name, category } = parsed.data;
  if (
    !isItemImagePath(imagePath, { userId, itemId }) ||
    !isItemImagePath(thumbnailPath, { userId, itemId, thumb: true })
  )
    return { status: "error", message: "Upload a photo for this item again." };

  const { error } = await supabase.from("clothing_items").insert({
    id: itemId,
    name,
    category,
    image_path: imagePath,
    thumbnail_path: thumbnailPath,
  });
  if (error)
    return {
      status: "error",
      message: "Couldn't save your clothing. Try again.",
    };

  revalidatePath("/closet");
  return { status: "success", message: "Clothing added to your closet." };
}
