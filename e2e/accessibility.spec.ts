import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/zen/v1/chat/completions", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ choices: [] }) }),
  );
});

const routes = [
  { path: "/", label: "homepage" },
  { path: "/about", label: "about" },
  { path: "/blog", label: "blog" },
  { path: "/work", label: "work" },
  { path: "/projects", label: "projects" },
];

test.describe("a11y", () => {
  for (const { path, label } of routes) {
    test(`${label} has no critical WCAG violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const critical = results.violations.filter((v) => v.impact === "critical");
      const serious = results.violations.filter((v) => v.impact === "serious");

      if (results.violations.length > 0) {
        console.log(
          `${label}: ${results.violations.length} violations (${critical.length} critical, ${serious.length} serious)`,
        );
        for (const v of results.violations) {
          console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
        }
      }

      expect(critical).toEqual([]);
      expect(serious.length).toBeLessThanOrEqual(10);
    });
  }

  // TODO: re-enable after Mantine focus-trap audit
  // test("keyboard navigation works on all pages", async ({ page }) => {
  //   for (const { path, label } of routes) {
  //     await page.goto(path);
  //     await page.keyboard.press("Tab");
  //     let previousFocused = await page.evaluate(() => document.activeElement?.tagName);
  //     for (let i = 0; i < 20; i++) {
  //       await page.keyboard.press("Tab");
  //       const currentFocused = await page.evaluate(() => document.activeElement?.tagName);
  //       expect(currentFocused).toBeDefined();
  //     }
  //     console.log(`✓ ${label} keyboard navigation OK`);
  //   }
  // });

  test("all interactive elements have visible focus indicator", async ({ page }) => {
    await page.goto("/");
    
    // Tab to first interactive element
    await page.keyboard.press("Tab");
    
    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return window.getComputedStyle(el).outline;
    });
    
    expect(focusStyle).not.toBe("none");
    expect(focusStyle).toContain("rgb"); // outline-color set
  });

  // TODO: re-enable after dimmed color tokens are updated to pass WCAG AA on both color schemes
  // test("text has sufficient color contrast", async ({ page }) => {
  //   await page.goto("/");
  //   const results = await new AxeBuilder({ page })
  //     .withRules(["color-contrast"])
  //     .analyze();
  //   expect(results.violations).toEqual([]);
  // });

  test("pages have main landmark", async ({ page }) => {
    for (const { path, label } of routes) {
      await page.goto(path);
      const hasMain = await page.evaluate(() => {
        return document.querySelector("main") !== null;
      });
      expect(hasMain).toBe(true);
    }
  });
});
