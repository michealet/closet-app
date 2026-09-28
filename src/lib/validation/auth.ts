import { z } from "zod";

/** A same-origin path to return to after sign-in. Rejects absolute and protocol-relative URLs. */
export const redirectPathSchema = z
  .string()
  .regex(/^\/(?![/\\])/, "Must be a relative path")
  .catch("/account");

export const PASSWORD_MIN = 8;
/** Supabase (bcrypt) ignores anything past 72 bytes. */
export const PASSWORD_MAX = 72;

export const signInSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
  next: redirectPathSchema,
});

export const signUpSchema = signInSchema.extend({
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters`),
});

export type SignInInput = z.infer<typeof signInSchema>;
