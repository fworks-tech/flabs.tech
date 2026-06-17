import { expect, test } from "@playwright/test";

const staticRoutes = ["/", "/about", "/blog", "/work", "/projects"];

const detailSlugs = {
  "/blog": ["graphql-federation-at-scale", "agenthood-the-academy"],
  "/projects": ["agenthood", "apollodroid", "driveline", "flabs-tech", "verihire"],
  "/work": ["agenthood", "apollodroid", "driveline", "flabs-tech", "verihire"],
};

test.describe("smoke tests", () => {
  for (const route of staticRoutes) {
    test(`${route} loads 200 with no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      expect(errors).toEqual([]);
    });
  }

  for (const [base, slugs] of Object.entries(detailSlugs)) {
    for (const slug of slugs) {
      test(`${base}/${slug} loads 200`, async ({ page }) => {
        const res = await page.goto(`${base}/${slug}`);
        expect(res?.status()).toBe(200);
      });
    }
  }

  test("404 for unknown route", async ({ page }) => {
    await page.goto("/nonexistent");
    await expect(page.locator("text=404")).toBeVisible();
  });
});
