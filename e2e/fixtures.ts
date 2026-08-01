import { test as base } from "@playwright/test";

/**
 * Emulates prefers-reduced-motion: reduce for every test.
 * - Accessibility win: tests run under the same conditions as reduced-motion users (WCAG 2.3.3).
 * - Stability win: infinite CSS animations (e.g. the AI assistant breathing avatar)
 *   would otherwise make Playwright's element-stability checks time out.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from "@playwright/test";
