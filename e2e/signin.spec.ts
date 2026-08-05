import { expect, test } from "@playwright/test";

/**
 * GitHub SSO flow (admin area).
 *
 * Covers the unauthenticated redirect chain up to the GitHub OAuth
 * authorize page. The full OAuth exchange requires real GitHub
 * credentials and is exercised manually; this suite guards the
 * client-side regression where the CSP form-action directive blocked
 * the sign-in form POST entirely.
 */
test.describe("GitHub sign-in", () => {
  test("admin redirects to the Auth.js sign-in page when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/api\/auth\/signin\?callbackUrl=/);
    await expect(page.locator('button:has-text("Sign in with GitHub")')).toBeVisible();
  });

  test("sign-in form POSTs to the GitHub provider endpoint", async ({ page }) => {
    await page.goto("/api/auth/signin?callbackUrl=%2Fadmin");

    let postSeen = false;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/auth/signin/github")) {
        postSeen = true;
      }
    });

    await page.locator('button:has-text("Sign in with GitHub")').click();

    // The server responds 302 to GitHub's OAuth authorize page.
    await expect
      .poll(() => postSeen, { timeout: 5000 })
      .toBe(true);
  });

  test("clicking Sign in with GitHub navigates to GitHub OAuth authorize", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/api/auth/signin?callbackUrl=%2Fadmin");
    await page.locator('button:has-text("Sign in with GitHub")').click();

    // GitHub shows its login page (with return_to) when the user is not
    // signed in; signed-in users land directly on /login/oauth/authorize.
    await expect(page).toHaveURL(/https:\/\/github\.com\/(login\/oauth\/authorize|login)\?.*client_id=/);
    expect(errors).toEqual([]);
  });

  test("GitHub provider is configured server-side", async ({ request }) => {
    const res = await request.get("/api/auth/providers");
    expect(res.status()).toBe(200);
    const providers = await res.json();
    expect(providers.github).toBeDefined();
    expect(providers.github.type).toBe("oauth");
    expect(providers.github.callbackUrl).toContain("/api/auth/callback/github");
  });

  test("unknown sign-in actions surface a configuration error instead of hanging", async ({ page }) => {
    const res = await page.goto("/api/auth/signin/github");
    expect(res?.status()).toBeGreaterThanOrEqual(400);
  });
});
