/**
 * Reading and deleting closet images. Works with the browser or the server
 * Supabase client; the bucket's policies limit both to the user's own folder.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CLOSET_BUCKET } from "./paths";

/** Signed URLs last an hour: long enough for a session, short enough to not leak. */
export const SIGNED_URL_SECONDS = 60 * 60;

/**
 * Signed URLs for many paths in one request (grids). Returns a map from path
 * to URL; paths that couldn't be signed are left out.
 */
export async function signedImageUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
  expiresIn = SIGNED_URL_SECONDS,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from(CLOSET_BUCKET)
    .createSignedUrls(unique, expiresIn);
  if (error || !data) return new Map();

  return new Map(
    data.flatMap((entry) =>
      entry.path && entry.signedUrl ? [[entry.path, entry.signedUrl]] : [],
    ),
  );
}

/**
 * Deletes files from the closet bucket. Deleting a row doesn't remove its
 * images, so delete actions call this too (AGENTS.md). Returns false on failure.
 */
export async function removeClosetFiles(
  supabase: SupabaseClient<Database>,
  paths: (string | null | undefined)[],
): Promise<boolean> {
  const existing = paths.filter((p): p is string => Boolean(p));
  if (existing.length === 0) return true;
  const { error } = await supabase.storage.from(CLOSET_BUCKET).remove(existing);
  return !error;
}
