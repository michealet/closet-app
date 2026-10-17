"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { z } from "zod";
import {
  CLOSET_BUCKET,
  isOutfitImagePath,
  outfitThumbnailPath,
} from "@/lib/images/paths";
import { removeClosetFiles } from "@/lib/images/storage";
import { createClient } from "@/lib/supabase/server";
import { favoriteSchema } from "@/features/clothing/schema";
import { NAME_MAX } from "@/lib/constants";
import { outfitSchema, planSchema } from "./schema";

const FAILED = "Couldn't save your outfit. Try again.";

/**
 * Saves a new outfit and where its pieces sit on the canvas (OC-9, OC-10).
 * The thumbnail is uploaded from the browser first (ADR 0002); if this
 * fails, the caller removes it.
 */
export async function saveOutfit(input: unknown): Promise<ActionState> {
  const parsed = outfitSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to save your outfit." };

  const { outfitId, thumbnailPath, items, isFavorite, ...details } =
    parsed.data;
  if (thumbnailPath && !isOutfitImagePath(thumbnailPath, { userId, outfitId }))
    return { status: "error", message: FAILED };

  const { error } = await supabase.from("outfits").insert({
    id: outfitId,
    ...details,
    is_favorite: isFavorite,
    thumbnail_path: thumbnailPath,
  });
  if (error) return { status: "error", message: FAILED };

  // RLS only lets pieces from the user's own closet onto their own outfit.
  const { error: itemsError } = await supabase.from("outfit_items").insert(
    items.map((item) => ({
      outfit_id: outfitId,
      clothing_item_id: item.id,
      x: item.x,
      y: item.y,
      width: item.width,
      z_index: item.z,
    })),
  );
  if (itemsError) {
    // No half-saved outfits: its pieces go with it (on delete cascade).
    await supabase.from("outfits").delete().eq("id", outfitId);
    return {
      status: "error",
      message:
        itemsError.code === "23503"
          ? "A piece was removed from your closet. Take it off and save again."
          : FAILED,
    };
  }

  revalidatePath("/outfits");
  return { status: "success", message: "Outfit saved." };
}

/** Heart toggle on outfit cards and Outfit Detail (OU-1, FV-1, FV-2). */
export async function setOutfitFavorite(input: unknown): Promise<ActionState> {
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: "Couldn't update your favorite." };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("outfits")
    .update({ is_favorite: parsed.data.isFavorite })
    .eq("id", parsed.data.id)
    .select("id");
  if (error || !rows?.length)
    return { status: "error", message: "Couldn't update your favorite." };

  revalidatePath("/outfits");
  return {
    status: "success",
    message: parsed.data.isFavorite
      ? "Added to favorites."
      : "Removed from favorites.",
  };
}

/**
 * Delete (OU-4). The database also removes its pieces and calendar plans
 * (OU-5); the thumbnail file has to go separately (AGENTS.md).
 */
export async function deleteOutfit(outfitId: unknown): Promise<ActionState> {
  const id = z.uuid().safeParse(outfitId);
  if (!id.success)
    return { status: "error", message: "Couldn't delete this outfit." };

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", id.data)
    .select("thumbnail_path");
  if (error)
    return {
      status: "error",
      message: "Couldn't delete this outfit. Try again.",
    };
  if (!rows?.length)
    return { status: "error", message: "This outfit no longer exists." };

  const removed = await removeClosetFiles(
    supabase,
    rows.map((row) => row.thumbnail_path),
  );
  revalidatePath("/outfits");
  return {
    status: "success",
    message: removed
      ? "Outfit deleted."
      : "Outfit deleted, but its picture couldn't be removed.",
  };
}

/** Assign to date (CA-3, CA-4). A day can hold several plans (CA-5). */
export async function planOutfit(input: unknown): Promise<ActionState> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  // RLS only accepts the user's own outfit.
  const { error } = await supabase.from("planned_outfits").insert({
    outfit_id: parsed.data.outfitId,
    date: parsed.data.date,
    event_name: parsed.data.eventName,
  });
  if (error)
    return {
      status: "error",
      message: "Couldn't plan this outfit. Try again.",
    };

  revalidatePath(`/outfits/${parsed.data.outfitId}`);
  revalidatePath("/calendar");
  return { status: "success", message: "Outfit planned." };
}

/**
 * Edit (OC-11, OU-4): saves the details and moves, adds and removes pieces.
 * New and moved pieces are saved before old ones are removed, so a failure
 * part-way never leaves the outfit empty.
 */
export async function updateOutfit(input: unknown): Promise<ActionState> {
  const parsed = outfitSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to save your outfit." };

  const { outfitId, thumbnailPath, items, isFavorite, ...details } =
    parsed.data;
  if (thumbnailPath && !isOutfitImagePath(thumbnailPath, { userId, outfitId }))
    return { status: "error", message: FAILED };

  // RLS hides other users' outfits, so updating one changes nothing.
  const { data: rows, error } = await supabase
    .from("outfits")
    .update({
      ...details,
      is_favorite: isFavorite,
      thumbnail_path: thumbnailPath,
    })
    .eq("id", outfitId)
    .select("id");
  if (error) return { status: "error", message: FAILED };
  if (!rows?.length)
    return { status: "error", message: "This outfit no longer exists." };

  const { error: placeError } = await supabase.from("outfit_items").upsert(
    items.map((item) => ({
      outfit_id: outfitId,
      clothing_item_id: item.id,
      x: item.x,
      y: item.y,
      width: item.width,
      z_index: item.z,
    })),
  );
  if (placeError)
    return {
      status: "error",
      message:
        placeError.code === "23503"
          ? "A piece was removed from your closet. Take it off and save again."
          : FAILED,
    };
  const { error: removeError } = await supabase
    .from("outfit_items")
    .delete()
    .eq("outfit_id", outfitId)
    .not(
      "clothing_item_id",
      "in",
      `(${items.map((item) => item.id).join(",")})`,
    );
  if (removeError) return { status: "error", message: FAILED };

  revalidatePath("/outfits");
  revalidatePath(`/outfits/${outfitId}`);
  return { status: "success", message: "Changes saved." };
}

export type DuplicateState = ActionState & { outfitId?: string };

/**
 * Duplicate (OU-4): "Copy of …" with the same pieces, details and picture.
 * The caller opens the copy in the creator.
 */
export async function duplicateOutfit(
  outfitId: unknown,
): Promise<DuplicateState> {
  const id = z.uuid().safeParse(outfitId);
  if (!id.success)
    return { status: "error", message: "Couldn't duplicate this outfit." };

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (authError || !userId)
    return { status: "error", message: "Sign in again to duplicate it." };

  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "name, occasion, seasons, notes, thumbnail_path, outfit_items(clothing_item_id, x, y, width, z_index)",
    )
    .eq("id", id.data)
    .maybeSingle();
  if (!outfit)
    return { status: "error", message: "This outfit no longer exists." };

  const copyId = crypto.randomUUID();
  // Same picture under the copy's own path; without it the copy still works.
  let thumbnail: string | null = null;
  if (outfit.thumbnail_path) {
    const ext = outfit.thumbnail_path.endsWith(".jpg") ? "jpg" : "webp";
    const target = outfitThumbnailPath(userId, copyId, ext);
    const { error } = await supabase.storage
      .from(CLOSET_BUCKET)
      .copy(outfit.thumbnail_path, target);
    if (!error) thumbnail = target;
  }

  const pieces = outfit.outfit_items;
  const { error } = await supabase.from("outfits").insert({
    id: copyId,
    name: `Copy of ${outfit.name}`.slice(0, NAME_MAX),
    occasion: outfit.occasion,
    seasons: outfit.seasons,
    notes: outfit.notes,
    thumbnail_path: thumbnail,
  });
  if (error) {
    await removeClosetFiles(supabase, [thumbnail]);
    return { status: "error", message: "Couldn't duplicate this outfit." };
  }
  if (pieces.length) {
    const { error: piecesError } = await supabase
      .from("outfit_items")
      .insert(pieces.map((piece) => ({ ...piece, outfit_id: copyId })));
    if (piecesError) {
      await supabase.from("outfits").delete().eq("id", copyId);
      await removeClosetFiles(supabase, [thumbnail]);
      return { status: "error", message: "Couldn't duplicate this outfit." };
    }
  }

  revalidatePath("/outfits");
  return { status: "success", message: "Outfit duplicated.", outfitId: copyId };
}
