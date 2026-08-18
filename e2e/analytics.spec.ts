import { expect, test } from "@playwright/test";

test.describe("analytics tracking elements", () => {
  test("hero CTA buttons are visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/projects"]:has-text("View Projects")')).toBeVisible();
    await expect(page.locator('a[href="/about"]:has-text("About Me")')).toBeVisible();
  });

  test("nav links are clickable and fire navigation", async ({ page }) => {
    await page.goto("/");
    const links = [
      { href: "/about", text: "About" },
      { href: "/projects", text: "Projects" },
      { href: "/blog", text: "Blog" },
      { href: "/work", text: "Work" },
    ];

    for (const { href, text } of links) {
      await page.locator(`a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(href));
      await page.goBack();
    }
  });

  test("footer social links are visible", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const github = footer.locator('a[aria-label*="GitHub"]');
    const linkedin = footer.locator('a[aria-label*="LinkedIn"]');

    await expect(github).toBeVisible();
    await expect(linkedin).toBeVisible();
  });

  test("social links have correct hrefs", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");

    const githubLink = await footer.locator('a[aria-label*="GitHub"]').getAttribute("href");
    expect(githubLink).toContain("github.com");

    const linkedinLink = await footer.locator('a[aria-label*="LinkedIn"]').getAttribute("href");
    expect(linkedinLink).toContain("linkedin.com");
  });

  test("View Projects CTA navigates to projects page", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/projects"]:has-text("View Projects")').click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("About Me CTA navigates to about page", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/about"]:has-text("About Me")').click();
    await expect(page).toHaveURL(/\/about/);
  });

  test("Recent Projects section is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Recent Projects")).toBeVisible();
  });

  test("Recent Posts section is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Recent Posts")).toBeVisible();
  });

  test("View all projects link navigates to projects", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/projects"]:has-text("View all")').first().click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("View all posts link navigates to blog", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/blog"]:has-text("View all")').click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("self-hosted tracking fires by default without consent interaction", async ({ page }) => {
    const beacons: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/analytics/event")) beacons.push(req.url());
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible();

    // Unload triggers the buffered session/pageview flush via sendBeacon.
    await page.goto("/about");

    await expect.poll(() => beacons.length).toBeGreaterThan(0);
  });

  test("declining persists and hides the banner", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-testid="consent-decline"]').click();
    await expect(page.locator('[data-testid="consent-banner"]')).toBeHidden();

    const cookie = await page.evaluate(() => document.cookie);
    expect(cookie).toContain("_fa_consent=declined");

    await page.goto("/about");
    await expect(page.locator('[data-testid="consent-banner"]')).not.toBeVisible();
  });

  test("privacy settings link re-opens the banner", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-testid="consent-decline"]').click();

    await page.locator('[data-testid="privacy-settings"]').click();
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible();

    const cookie = await page.evaluate(() => document.cookie);
    expect(cookie).not.toContain("_fa_consent=declined");
  });

  test("a header nav click emits exactly one nav_click beacon", async ({ page }) => {
    const navClicks: Array<{ ty?: string; p?: string }> = [];
    await page.route("**/api/analytics/event", (route) => {
      const data = route.request().postData ? JSON.parse(route.request().postData() as string) : null;
      if (Array.isArray(data)) {
        for (const ev of data) {
          if (ev.ty === "nav_click") navClicks.push(ev);
        }
      }
      route.continue();
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    await page.locator('header a[href="/about"]').first().click();
    await expect(page).toHaveURL(/\/about/);

    // The buffered nav_click flushes via the 5s interval.
    await expect.poll(() => navClicks.length, { timeout: 7000 }).toBeGreaterThan(0);
    expect(navClicks).toHaveLength(1);
    expect(navClicks[0].p).toBe("/about");
  });
});
