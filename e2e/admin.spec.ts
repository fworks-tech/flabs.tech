import { expect, test } from "@playwright/test";

/**
 * Authenticated admin render (fake-session backdoor).
 *
 * GitHub SSO cannot run in CI, so `requireSession` returns a fake
 * session when `E2E_FAKE_SESSION=1` (set in playwright.config webServer
 * env) AND the `e2e_fake_session` cookie is present. This suite guards
 * the authenticated render of every admin route — regression coverage
 * for the React #130 crashes (compound Mantine components accessed
 * from Server Components) and the "use server" serialization error.
 */

const ADMIN_ROUTES = [
  "/admin",
  "/admin/drafts",
  "/admin/publishing",
  "/admin/ai",
  "/admin/quiz",
  "/admin/analytics",
];

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "e2e_fake_session",
      value: "1",
      url: "http://localhost:3000",
    },
  ]);
});

test.describe("admin (fake session)", () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route} renders without an error boundary`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });

      await page.goto(route);

      await expect(page.getByText("flabs.tech Admin", { exact: true })).toBeVisible();
      expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
    });
  }

  test("dashboard shows the fake user and stat cards", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("fworks-tech", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Overview of the last 7 days across the internal systems."),
    ).toBeVisible();
  });

  test("draft preview renders for a draft post", async ({ page }) => {
    await page.goto("/admin/drafts");
    await expect(page.getByText("Drafts & scheduled posts", { exact: true })).toBeVisible();

    const preview = page.getByRole("link", { name: /Preview/ }).first();
    if (await preview.isVisible().catch(() => false)) {
      await preview.click();
      await expect(page).toHaveURL(/\/admin\/drafts\/.+/);
      await expect(page.getByRole("link", { name: /Back to drafts/ })).toBeVisible();
    }
  });
});
