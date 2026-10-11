import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Brands already used in the user's closet, for suggestions (AC-5). */
export async function brandSuggestions(
  supabase: SupabaseClient<Database>,
): Promise<{ brands: string[]; failed: boolean }> {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("brand")
    .not("brand", "is", null);
  const brands = [
    ...new Set(
      (data ?? []).flatMap(({ brand }) =>
        brand?.trim() ? [brand.trim()] : [],
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));
  return { brands, failed: Boolean(error) };
}
