import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      ...process.env,
      // Deterministic server-side data (projects page fetches GitHub server-side,
      // which Playwright's page.route cannot intercept).
      E2E_GITHUB_MOCK: "1",
      // PostHog is disabled in e2e: tracking is opt-out by default, so a live
      // key would initialize PostHog on every page and emit real network calls
      // (and errors against an invalid stub key). Empties keep it a silent no-op.
      NEXT_PUBLIC_POSTHOG_KEY: "",
      NEXT_PUBLIC_POSTHOG_HOST: "",
      // Enable the admin fake-session backdoor (requires the
      // `e2e_fake_session` cookie, set by e2e/admin.spec.ts).
      E2E_FAKE_SESSION: "1",
    },
  },
  snapshotPathTemplate: "{testDir}/{arg}{ext}",
});
