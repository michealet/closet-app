import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // The app is phone-first; Pixel runs on Chromium, so no extra browser install.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    // Safari's engine, for browser differences such as WebP encoding (ADR 0002).
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /images\.spec\.ts/,
    },
  ],
  webServer: {
    // CI tests the production build; locally, reuse a running `pnpm dev`.
    // Call `next` directly (it's on PATH under `pnpm test:e2e`): pnpm runs
    // scripts in their own process group, so Playwright can't stop them and
    // hangs after the tests finish.
    command: CI ? "next build && next start" : "next dev",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
