import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Brands (AC-5) and tags (#36) already used in the closet, for suggestions. */
export async function closetSuggestions(
  supabase: SupabaseClient<Database>,
): Promise<{ brands: string[]; tags: string[]; failed: boolean }> {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("brand, tags");
  const sorted = (values: string[]) =>
    [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    brands: sorted(
      (data ?? []).flatMap(({ brand }) =>
        brand?.trim() ? [brand.trim()] : [],
      ),
    ),
    tags: sorted((data ?? []).flatMap(({ tags }) => tags)),
    failed: Boolean(error),
  };
}
