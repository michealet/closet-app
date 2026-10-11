"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { isItemImagePath } from "@/lib/images/paths";
import { removeClosetFiles } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";
import {
  clothingSchema,
  clothingUpdateSchema,
  favoriteSchema,
  withName,
} from "./schema";

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
    ...withName(details),
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
    .update({ ...withName(details), ...photo })
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

/** Heart toggle (ID-2, FV-2). The button updates first and undoes on error. */
export async function setItemFavorite(input: unknown): Promise<ActionState> {
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: "Couldn't update your favorite." };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("clothing_items")
    .update({ is_favorite: parsed.data.isFavorite })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || !rows?.length)
    return { status: "error", message: "Couldn't update your favorite." };

  revalidatePath("/closet");
  return {
    status: "success",
    message: parsed.data.isFavorite
      ? "Added to favorites."
      : "Removed from favorites.",
  };
}

/**
 * Delete (ID-4, ID-5). Outfits keep going without the item (the database
 * removes it from outfit_items). Deleting the row doesn't remove its photos,
 * so this does (AGENTS.md).
 */
export async function deleteClothing(itemId: unknown): Promise<ActionState> {
  const id = z.uuid().safeParse(itemId);
  if (!id.success)
    return { status: "error", message: "Couldn't delete this item." };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("clothing_items")
    .delete()
    .eq("id", id.data)
    .select("image_path, thumbnail_path, image_processed_path");
  if (error)
    return {
      status: "error",
      message: "Couldn't delete this item. Try again.",
    };
  if (!rows?.length)
    return {
      status: "error",
      message: "This item is no longer in your closet.",
    };

  const removed = await removeClosetFiles(
    supabase,
    rows.flatMap((row) => [
      row.image_path,
      row.thumbnail_path,
      row.image_processed_path,
    ]),
  );
  revalidatePath("/closet");
  return {
    status: "success",
    message: removed
      ? "Item deleted."
      : "Item deleted, but its photo couldn't be removed.",
  };
}
