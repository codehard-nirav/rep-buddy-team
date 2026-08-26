import { expect, test } from "@playwright/test";
import { hasTestAccount, signIn } from "./helpers/auth";

test.describe("login", () => {
  test.skip(!hasTestAccount, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated flows");

  test("rejects bad credentials with an error message", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email address").fill("not-a-real-user@example.com");
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-password");
    await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/couldn't sign you in|invalid/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("signs in with email and password and lands on the dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
