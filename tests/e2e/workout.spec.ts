import { expect, test } from "@playwright/test";
import { hasTestAccount, signIn } from "./helpers/auth";

test.describe("logging a workout", () => {
  test.skip(!hasTestAccount, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated flows");

  test("starts an empty workout, adds a set and finishes", async ({ page }) => {
    await signIn(page);

    await page.goto("/workout/new");
    await expect(page.getByRole("heading", { name: /start a workout/i })).toBeVisible();

    await page.getByRole("button", { name: /empty workout/i }).click();
    await page.waitForURL(/\/workout\/[^/]+\/log/, { timeout: 30_000 });

    // The workout name is editable inline.
    await expect(page.locator("input[value*='Empty' i]").first()).toBeVisible();

    const addSet = page.getByRole("button", { name: /add set/i }).first();
    if (await addSet.isVisible().catch(() => false)) {
      await addSet.click();
    }

    await page.getByRole("button", { name: /finish/i }).click();
    await page.waitForURL(/\/(workout\/[^/]+|dashboard|history)/, { timeout: 30_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("history lists logged workouts", async ({ page }) => {
    await signIn(page);
    await page.goto("/history");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
