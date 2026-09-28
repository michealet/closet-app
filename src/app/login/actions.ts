"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

/** Signs in, or creates an account when the form's `intent` is "signup". */
export async function authenticate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const signUp = formData.get("intent") === "signup";
  const parsed = (signUp ? signUpSchema : signInSchema).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { email, password, next } = parsed.data;

  const supabase = await createClient();

  if (signUp) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return {
        status: "error",
        message:
          error.code === "user_already_exists"
            ? "An account with that email already exists. Sign in instead."
            : error.message,
      };
    }
    // No session means the project still requires email confirmation.
    if (!data.session) {
      return {
        status: "success",
        message: `Check ${email} to confirm your account, then sign in.`,
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return {
        status: "error",
        message:
          error.code === "invalid_credentials"
            ? "Incorrect email or password."
            : error.message,
      };
    }
  }

  redirect(next);
}
