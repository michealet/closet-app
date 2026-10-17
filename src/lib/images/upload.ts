/**
 * Uploads a clothing photo straight from the browser to Storage (ADR 0002).
 * Image files never go through a Server Action (1 MB limit); after uploading,
 * the caller saves the row with a Server Action and, if that fails, calls
 * `removeClosetFiles` with the returned paths.
 *
 * Browser only.
 */

import { createClient } from "@/lib/supabase/client";
import { CLOSET_BUCKET, itemImagePaths, outfitThumbnailPath } from "./paths";
import {
  canEncodeWebp,
  ImageError,
  JPEG_QUALITY,
  prepareImage,
  WEBP_QUALITY,
  type PreparedImage,
} from "./prepare";

export type UploadedItemPhoto = {
  itemId: string;
  imagePath: string;
  thumbnailPath: string;
};

const UPLOAD_FAILED =
  "Couldn't upload your photo. Check your connection and try again.";

/**
 * Prepares `file` and uploads the full image and thumbnail.
 *
 * - New item: omit `itemId`; a new id is generated. Insert the row with it.
 * - Replacing an existing item's photo (AC-10): pass its id. If the stored
 *   extension changed (e.g. WebP → JPEG on another device), delete the old
 *   paths after saving the new ones.
 */
export async function uploadItemPhoto(
  file: File,
  itemId?: string,
): Promise<UploadedItemPhoto> {
  const prepared = await prepareImage(file);

  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new ImageError("Your session has expired. Sign in again.");

  const id = itemId ?? crypto.randomUUID();
  const paths = itemImagePaths(userId, id, prepared.ext);
  const bucket = supabase.storage.from(CLOSET_BUCKET);
  const options = {
    contentType: prepared.contentType,
    cacheControl: "3600",
    // New items never overwrite; replacing a photo reuses its paths.
    upsert: itemId !== undefined,
  };

  const full = await bucket.upload(paths.imagePath, prepared.full, options);
  if (full.error) throw new ImageError(UPLOAD_FAILED, { cause: full.error });

  const thumb = await bucket.upload(
    paths.thumbnailPath,
    prepared.thumb,
    options,
  );
  if (thumb.error) {
    // Don't leave a full image behind without its thumbnail.
    if (itemId === undefined) await bucket.remove([paths.imagePath]);
    throw new ImageError(UPLOAD_FAILED, { cause: thumb.error });
  }

  return { itemId: id, ...paths };
}

/**
 * Encodes a drawn outfit canvas (OC-10) as WebP, or JPEG where the browser
 * can't (Safari), and uploads it as the outfit's thumbnail. Returns its path.
 */
export async function uploadOutfitThumbnail(
  canvas: HTMLCanvasElement,
  outfitId: string,
): Promise<string> {
  const webp = await canEncodeWebp();
  const contentType = webp ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, contentType, webp ? WEBP_QUALITY : JPEG_QUALITY),
  );
  if (!blob) throw new ImageError("Couldn't make a picture of your outfit.");

  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) throw new ImageError("Your session has expired. Sign in again.");

  const path = outfitThumbnailPath(userId, outfitId, webp ? "webp" : "jpg");
  const { error } = await supabase.storage
    .from(CLOSET_BUCKET)
    .upload(path, blob, { contentType, cacheControl: "3600", upsert: true });
  if (error) throw new ImageError(UPLOAD_FAILED, { cause: error });
  return path;
}

export type { PreparedImage };
