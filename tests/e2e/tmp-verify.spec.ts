import { expect, test } from "@playwright/test";

test("verify dashboard quick links + finish", async ({ page, context }) => {
  const cj = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;
  if (cj) await context.addCookies(JSON.parse(cj).map((c: any) => ({ ...c, url: "http://localhost:8080" })));
  await page.goto("/");
  await page.evaluate(([k, v]) => window.localStorage.setItem(k as string, v as string), [
    process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY!,
    process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON!,
  ]);
  await page.goto("/dashboard");
  await page.waitForTimeout(2500);
  await page.getByRole("link", { name: /browse exercises/i }).click();
  await expect(page).toHaveURL(/\/exercises/);
  await page.goto("/dashboard");
  await page.waitForTimeout(2000);
  await page.getByRole("link", { name: /view progress/i }).click();
  await expect(page).toHaveURL(/\/progress/);

  await page.goto("/workout/new");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /empty workout/i }).click();
  await page.waitForURL(/\/workout\/[^/]+\/log/);
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: /finish/i }).click();
  await page.waitForTimeout(4000);
  console.log("AFTER FINISH", page.url());
});
