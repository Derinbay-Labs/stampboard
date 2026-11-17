import { expect, test } from "@playwright/test";

const CLONE =
  "git clone https://github.com/derinbay/stampboard.git\ncd stampboard && npm start";

test.describe("landing smoke", () => {
  for (const [locale, h1] of [
    ["en", "Your GitHub day, on one screen."],
    ["tr", /.+/],
  ] as const) {
    test(`/${locale}/ renders the page`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      await expect(page.locator(".screen .board")).toContainText("Stampboard");
    });
  }

  test("copy button copies the install command", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/en/");
    const button = page.locator(".cmd").first().getByRole("button");
    await button.click();
    await expect(button).toContainText("Copied");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.replaceAll(String.fromCharCode(13, 10), String.fromCharCode(10))).toBe(CLONE);
  });

  test("language switch goes to the other locale", async ({ page }) => {
    await page.goto("/en/");
    await page.locator(".seg").getByRole("link", { name: "TR" }).click();
    await expect(page).toHaveURL(/\/tr\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");
    await expect(page.locator(".seg a[aria-current='true']")).toHaveText("TR");
  });

  test("follows the system colour scheme", async ({ page }) => {
    const ground = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/en/");
    const light = await ground();
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await ground()).not.toBe(light);
  });

  test("scene tabs move with the keyboard and notes light a part", async ({ page }) => {
    await page.goto("/en/");
    await page.getByRole("tab").first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
    await page.locator(".note").first().click();
    await expect(page.locator(".screen .is-lit").first()).toBeVisible();
  });

  for (const locale of ["en", "tr"] as const) {
    test(`/${locale}/ footer links to the Labs page`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      const labs = page.locator("footer a.labs");
      await expect(labs).toHaveAttribute("href", `https://derinbay.com/${locale}/labs/`);
      await expect(page.locator("header a.labs, main a.labs")).toHaveCount(0);
    });
  }

  test("root offers both languages in its static HTML", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/href="\/en\/"/);
    expect(html).toMatch(/href="\/tr\/"/);
  });

  test("makes no third-party request and sets no cookie", async ({ page, context }) => {
    const external: string[] = [];
    page.on("request", (req) => {
      const { hostname } = new URL(req.url());
      if (hostname !== "localhost" && hostname !== "127.0.0.1") external.push(req.url());
    });
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");
    expect(external).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });

  test("mobile layout shift stays within budget", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile-390", "layout shift budget is asserted at 390x844");
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[])
          if (!e.hadRecentInput) w.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/en/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    expect(
      await page.evaluate(() => (window as unknown as { __cls: number }).__cls),
    ).toBeLessThanOrEqual(0.1);
  });
});
