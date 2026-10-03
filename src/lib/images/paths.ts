/**
 * Storage paths for closet images (ADR 0002). Pure functions, safe to use in
 * browser and server code. Every path starts with the owner's user id, which
 * the bucket policies and the database both enforce.
 */

export const CLOSET_BUCKET = "closet";

export type ImageExt = "webp" | "jpg";

export function itemImagePaths(userId: string, itemId: string, ext: ImageExt) {
  return {
    imagePath: `${userId}/items/${itemId}.${ext}`,
    thumbnailPath: `${userId}/items/${itemId}_thumb.${ext}`,
  };
}

export function outfitThumbnailPath(
  userId: string,
  outfitId: string,
  ext: ImageExt,
) {
  return `${userId}/outfits/${outfitId}.${ext}`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const ITEM_IMAGE = new RegExp(
  `^(${UUID})/items/(${UUID})(_thumb)?\\.(webp|jpg)$`,
);
const OUTFIT_IMAGE = new RegExp(`^(${UUID})/outfits/(${UUID})\\.(webp|jpg)$`);

/**
 * True if `path` is the full image (or, with `thumb`, the thumbnail) of
 * `itemId` in `userId`'s folder. Server Actions use this to check paths sent
 * from the browser before saving them.
 */
export function isItemImagePath(
  path: string,
  {
    userId,
    itemId,
    thumb = false,
  }: { userId: string; itemId: string; thumb?: boolean },
): boolean {
  const match = ITEM_IMAGE.exec(path);
  return (
    match !== null &&
    match[1] === userId &&
    match[2] === itemId &&
    Boolean(match[3]) === thumb
  );
}

/** True if `path` is `outfitId`'s thumbnail in `userId`'s folder. */
export function isOutfitImagePath(
  path: string,
  { userId, outfitId }: { userId: string; outfitId: string },
): boolean {
  const match = OUTFIT_IMAGE.exec(path);
  return match !== null && match[1] === userId && match[2] === outfitId;
}
