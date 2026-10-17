import type { SupabaseClient } from "@supabase/supabase-js";
import { signedImageUrls } from "@/lib/images/storage";
import type { Database } from "@/types/database";
import type { PickerItem } from "./outfit-creator";

/** Picker size cap; the closet is expected to stay in the hundreds (NF-2). */
const PICKER_LIMIT = 1000;

/** The closet for the creator's picker, with thumbnail URLs (ADR 0003). */
export async function pickerCloset(
  supabase: SupabaseClient<Database>,
): Promise<{ closet: PickerItem[]; failed: boolean }> {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("id, name, category, image_path, thumbnail_path")
    .order("created_at", { ascending: false })
    .order("id")
    .limit(PICKER_LIMIT);
  const items = data ?? [];
  // Thumbnails while editing; they're small and quick to draw.
  const urls = await signedImageUrls(
    supabase,
    items.map((item) => item.thumbnail_path ?? item.image_path),
  );
  return {
    closet: items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      photoUrl: urls.get(item.thumbnail_path ?? item.image_path) ?? null,
    })),
    failed: Boolean(error),
  };
}
