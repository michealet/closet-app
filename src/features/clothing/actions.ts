"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { isItemImagePath } from "@/lib/images/paths";
import { createClient } from "@/lib/supabase/server";
import { clothingSchema, clothingUpdateSchema } from "./schema";

export async function addClothing(input: unknown): Promise<ActionState> {
  const parsed = clothingSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to save your clothing." };

  const { itemId, imagePath, thumbnailPath, ...details } = parsed.data;
  if (
    !isItemImagePath(imagePath, { userId, itemId }) ||
    !isItemImagePath(thumbnailPath, { userId, itemId, thumb: true })
  )
    return { status: "error", message: "Upload a photo for this item again." };

  const { error } = await supabase.from("clothing_items").insert({
    id: itemId,
    ...details,
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

export async function updateClothing(input: unknown): Promise<ActionState> {
  const parsed = clothingUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to save your clothing." };

  const { itemId, imagePath, thumbnailPath, ...details } = parsed.data;
  const replaced = imagePath !== undefined && thumbnailPath !== undefined;
  if (
    replaced &&
    (!isItemImagePath(imagePath, { userId, itemId }) ||
      !isItemImagePath(thumbnailPath, { userId, itemId, thumb: true }))
  )
    return { status: "error", message: "Upload a photo for this item again." };
  const photo = replaced
    ? { image_path: imagePath, thumbnail_path: thumbnailPath }
    : {};

  // RLS hides other users' rows, so updating one changes nothing.
  const { data: rows, error } = await supabase
    .from("clothing_items")
    .update({ ...details, ...photo })
    .eq("id", itemId)
    .select("id");
  if (error)
    return {
      status: "error",
      message: "Couldn't save your changes. Try again.",
    };
  if (!rows?.length)
    return {
      status: "error",
      message: "This item is no longer in your closet.",
    };

  revalidatePath("/closet");
  return { status: "success", message: "Changes saved." };
}
