import { expect, type Page } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
export const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

/** Authenticated flows only run when test-account credentials are provided. */
export const hasTestAccount = Boolean(E2E_EMAIL && E2E_PASSWORD);

/**
 * Signs in through the real UI (email + password) and waits for an
 * authenticated route to render.
 */
export async function signIn(page: Page) {
  await page.goto("/auth");

  await page.getByLabel("Email address").fill(E2E_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 });

  // New accounts land on onboarding; push through to the dashboard.
  if (page.url().includes("/onboarding")) {
    await page.goto("/dashboard");
  }

  await expect(page).toHaveURL(/\/dashboard/);
}
