/**
 * Turns a user's photo into upload-ready images, in the browser (ADR 0002):
 * applies phone rotation, resizes to a full image and a thumbnail, and encodes
 * WebP, or JPEG where the browser can't encode WebP (Safari).
 *
 * Browser only: uses canvas and createImageBitmap.
 */

import type { ImageExt } from "./paths";

export const FULL_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 600;
export const WEBP_QUALITY = 0.82;
export const JPEG_QUALITY = 0.85;
/** Guards against decoding something huge enough to crash a phone's tab. */
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;

export type PreparedImage = {
  full: Blob;
  thumb: Blob;
  ext: ImageExt;
  contentType: "image/webp" | "image/jpeg";
  /** Size of `full` in pixels. */
  width: number;
  height: number;
};

/** An error whose message can be shown to the user as-is. */
export class ImageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageError";
  }
}

/** Scales width × height down so the longest edge fits `maxEdge`. Never upscales. */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function looksLikeHeic(file: Pick<File, "name" | "type">): boolean {
  return (
    /^image\/hei[cf](-sequence)?$/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

let webpSupport: Promise<boolean> | undefined;

/** Whether this browser's canvas can encode WebP (Safari returns PNG instead). */
export function canEncodeWebp(): Promise<boolean> {
  webpSupport ??= new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    canvas.toBlob((blob) => resolve(blob?.type === "image/webp"), "image/webp");
  });
  return webpSupport;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError(
      "That photo is too large (over 40 MB). Try a smaller one.",
    );
  }

  const bitmap = await decode(file);
  try {
    const webp = await canEncodeWebp();
    const contentType = webp ? "image/webp" : "image/jpeg";
    const quality = webp ? WEBP_QUALITY : JPEG_QUALITY;
    const fullSize = fitWithin(bitmap.width, bitmap.height, FULL_MAX_EDGE);
    const thumbSize = fitWithin(bitmap.width, bitmap.height, THUMB_MAX_EDGE);
    const [full, thumb] = await Promise.all([
      render(bitmap, fullSize, contentType, quality),
      render(bitmap, thumbSize, contentType, quality),
    ]);
    return {
      full,
      thumb,
      ext: webp ? "webp" : "jpg",
      contentType,
      ...fullSize,
    };
  } finally {
    bitmap.close();
  }
}

const UNREADABLE =
  "That file isn't a photo we can open. Try a JPEG, PNG, WebP or HEIC.";

/** Decodes with rotation applied; converts HEIC first where the browser can't read it. */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (error) {
    if (!looksLikeHeic(file))
      throw new ImageError(UNREADABLE, { cause: error });
  }
  const jpeg = await heicToJpeg(file);
  try {
    return await createImageBitmap(jpeg, { imageOrientation: "from-image" });
  } catch (error) {
    throw new ImageError(UNREADABLE, { cause: error });
  }
}

/** Only Safari decodes HEIC natively. Loads the ~3 MB converter on demand. */
async function heicToJpeg(file: File): Promise<Blob> {
  try {
    const { heicTo } = await import("heic-to/next");
    return await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  } catch (error) {
    throw new ImageError(UNREADABLE, { cause: error });
  }
}

/**
 * An object URL to show `file` as soon as it's chosen, before Save. HEIC is
 * converted where the browser can't show it. Revoke the URL when done.
 */
export async function previewPhoto(file: File): Promise<string> {
  if (looksLikeHeic(file)) {
    try {
      (await createImageBitmap(file)).close();
    } catch {
      return URL.createObjectURL(await heicToJpeg(file));
    }
  }
  return URL.createObjectURL(file);
}

async function render(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  type: PreparedImage["contentType"],
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context)
    throw new ImageError("Your browser couldn't process this photo.");

  if (type === "image/jpeg") {
    // JPEG has no transparency; without this, transparent areas turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
  if (!blob || blob.type !== type) {
    throw new ImageError("Your browser couldn't process this photo.");
  }
  return blob;
}
