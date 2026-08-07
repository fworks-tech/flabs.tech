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

  test("posthog stays dormant until consent is accepted", async ({ page }) => {
    const posthogRequests: string[] = [];
    page.on("request", (req) => {
      if (/\.posthog\.com/i.test(req.url())) posthogRequests.push(req.url());
    });

    await page.goto("/");
    await expect(page.locator('[data-testid="consent-banner"]')).toBeVisible();
    await page.waitForTimeout(750);
    expect(posthogRequests).toHaveLength(0);

    await page.locator('[data-testid="consent-accept"]').click();
    await expect(page.locator('[data-testid="consent-banner"]')).toBeHidden();
    await expect.poll(() => posthogRequests.length).toBeGreaterThan(0);
  });
});
