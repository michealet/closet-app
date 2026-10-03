"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.display_name })
    .eq("id", userId);
  if (error) {
    return {
      status: "error",
      message: "Could not save your profile. Try again.",
    };
  }

  revalidatePath("/profile");
  // Home greets the user by name (HM-1).
  revalidatePath("/");
  return { status: "success", message: "Profile saved." };
}
