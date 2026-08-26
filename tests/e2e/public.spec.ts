import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("landing page renders and links to sign in", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");

    await expect(page).toHaveTitle(/gymigo/i);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors, `page errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("auth page exposes email, password and Google sign-in", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("protected route redirects unauthenticated visitors to auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
  });
});
