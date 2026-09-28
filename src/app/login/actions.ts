"use server";

import { headers } from "next/headers";
import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { magicLinkSchema } from "@/lib/validation/auth";

export async function sendMagicLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { status: "error", message: "Could not determine the site URL." };
  }

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", parsed.data.next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.toString() },
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: `Check ${parsed.data.email} for your sign-in link.`,
  };
}
