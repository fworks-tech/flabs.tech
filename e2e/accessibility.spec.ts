import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
});
