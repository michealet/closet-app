import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  redirectPathSchema,
  signInSchema,
  signUpSchema,
} from "./auth";

describe("redirectPathSchema", () => {
  it("keeps same-origin paths", () => {
    expect(redirectPathSchema.parse("/closet?tab=tops")).toBe(
      "/closet?tab=tops",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "closet",
    undefined,
  ])("falls back to / for %s", (value) => {
    expect(redirectPathSchema.parse(value)).toBe("/");
  });
});

describe("signInSchema", () => {
  it("normalizes the email", () => {
    const result = signInSchema.parse({
      email: "  Maya@Example.COM ",
      password: "x",
    });
    expect(result.email).toBe("maya@example.com");
    expect(result.next).toBe("/");
  });

  it("requires a password", () => {
    const result = signInSchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const base = { email: "a@b.co" };

  it(`rejects passwords shorter than ${PASSWORD_MIN} characters`, () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: "a".repeat(PASSWORD_MIN - 1),
    });
    expect(result.success).toBe(false);
  });

  it(`rejects passwords longer than ${PASSWORD_MAX} characters`, () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: "a".repeat(PASSWORD_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a password at the minimum length", () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: "a".repeat(PASSWORD_MIN),
    });
    expect(result.success).toBe(true);
  });
});
