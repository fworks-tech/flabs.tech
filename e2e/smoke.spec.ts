import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Portfolio/);
});

test("about page loads", async ({ page }) => {
  const res = await page.goto("/about");
  expect(res?.status()).toBe(200);
});

test("blog page loads", async ({ page }) => {
  const res = await page.goto("/blog");
  expect(res?.status()).toBe(200);
});

test("work page loads", async ({ page }) => {
  const res = await page.goto("/work");
  expect(res?.status()).toBe(200);
});

test("projects page loads", async ({ page }) => {
  const res = await page.goto("/projects");
  expect(res?.status()).toBe(200);
});

test("404 for unknown route", async ({ page }) => {
  await page.goto("/nonexistent");
  await expect(page.locator("text=404")).toBeVisible();
});
