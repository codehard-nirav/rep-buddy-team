import { expect, test } from "@playwright/test";
import { hasTestAccount, signIn } from "./helpers/auth";

test.describe("progress", () => {
  test.skip(!hasTestAccount, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated flows");

  test("progress page renders without runtime errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await signIn(page);
    await page.goto("/progress");

    await expect(page.getByRole("heading", { name: /progress/i })).toBeVisible();
    expect(errors, `page errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("dashboard quick links reach exercises and progress", async ({ page }) => {
    await signIn(page);

    await page.getByRole("link", { name: /browse exercises/i }).click();
    await expect(page).toHaveURL(/\/exercises/);

    await page.goto("/dashboard");
    await page.getByRole("link", { name: /view progress/i }).click();
    await expect(page).toHaveURL(/\/progress/);
  });
});
