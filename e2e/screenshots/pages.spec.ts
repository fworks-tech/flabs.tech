import { expect, test } from "@playwright/test";

const STABLE_CSS = `
  canvas { display: none !important; }
  [data-visible] { animation: none !important; opacity: 1 !important; }
  *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }
`;

const pages = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/blog", name: "blog" },
  { path: "/work", name: "work" },
  { path: "/projects", name: "projects" },
];

test.describe("visual snapshots", () => {
  for (const { path, name } of pages) {
    test(`${name} desktop`, async ({ page }) => {
      await page.addStyleTag({ content: STABLE_CSS });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
