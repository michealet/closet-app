import { describe, expect, it, vi } from "vitest";

// proxy.ts imports server-only Supabase helpers; only isPublicPath is tested here.
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

const { isPublicPath } = await import("./proxy");

describe("isPublicPath", () => {
  it.each(["/login", "/auth/callback", "/auth/signout", "/api/health"])(
    "lets signed-out visitors open %s",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each([
    "/",
    "/closet",
    "/closet/new",
    "/outfits",
    "/calendar",
    "/profile",
    "/account",
    "/login-help",
    "/authors",
  ])("requires sign-in for %s", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
