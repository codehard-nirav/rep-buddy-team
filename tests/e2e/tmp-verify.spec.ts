import { test } from "@playwright/test";

test("verify authed selectors", async ({ page, context }) => {
  const cj = process.env.LOVABLE_BROWSER_SUPABASE_COOKIES_JSON;
  if (cj) await context.addCookies(JSON.parse(cj).map((c: any) => ({ ...c, url: "http://localhost:8080" })));
  await page.goto("/");
  const sk = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY!;
  const sj = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON!;
  await page.evaluate(([k, v]) => window.localStorage.setItem(k as string, v as string), [sk, sj]);
  for (const p of ["/dashboard", "/progress", "/history", "/workout/new"]) {
    await page.goto(p);
    await page.waitForTimeout(2500);
    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    console.log("PATH", p, "->", page.url(), "| h1:", h1);
  }
  await page.goto("/workout/new");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /empty workout/i }).click();
  await page.waitForTimeout(5000);
  console.log("AFTER", page.url());
  console.log("nameInput", await page.locator("input[value*='Empty' i]").count());
  console.log("finish", await page.getByRole("button", { name: /finish/i }).count());
  console.log("addset", await page.getByRole("button", { name: /add set/i }).count());
  console.log("quicklinks", await page.getByRole("link", { name: /view progress/i }).count());
});
