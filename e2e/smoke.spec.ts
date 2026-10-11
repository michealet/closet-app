import { expect, test } from "@playwright/test";

test("sign-in page loads", async ({ page }) => {
  const response = await page.goto("/login");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

// Every app page requires sign-in (src/lib/supabase/proxy.ts).
for (const path of [
  "/",
  "/closet",
  "/closet/new",
  "/closet/00000000-0000-4000-8000-000000000000/edit",
  "/outfits",
  "/outfits/new",
  "/calendar",
  "/profile",
]) {
  test(`signed-out visitors to ${path} are sent to sign in`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(path)}`);
  });
}

test("the old /account address goes to the profile", async ({ page }) => {
  await page.goto("/account");

  await expect(page).toHaveURL("/login?next=%2Fprofile");
});
