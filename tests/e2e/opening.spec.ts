import { test, expect, type Page } from "@playwright/test";
const overlay = (page: Page) =>
  page.getByRole("dialog", { name: "Abertura do portfólio" });
async function unlocked(page: Page) {
  await expect(overlay(page)).toHaveCount(0, { timeout: 11000 });
  await expect(page.locator("html")).not.toHaveAttribute("data-opening-lock");
  expect(
    await page
      .locator("#portfolio-page")
      .evaluate((el) => (el as HTMLElement).inert),
  ).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await expect(page.getByRole("link", { name: /Ver projetos/ })).toBeVisible();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
}
for (const width of [1440, 768, 390]) {
  test(`opening completes automatically at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(overlay(page)).toBeVisible();
    await expect(overlay(page)).toHaveAttribute("data-state", "playing");
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.mouse.wheel(0, 900);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await unlocked(page);
    expect(errors).toEqual([]);
    await page.reload();
    await expect(overlay(page)).toBeVisible();
    await expect(overlay(page)).toHaveAttribute("data-state", "playing");
    await overlay(page)
      .getByRole("button", { name: /Pular intro/i })
      .click();
    await unlocked(page);
  });
}
test("skip and keyboard focus release the page", async ({ page }) => {
  await page.goto("/");
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toHaveAttribute("data-state", "playing");
  await overlay(page)
    .getByRole("button", { name: /Pular intro/i })
    .click();
  await expect(overlay(page)).toHaveCount(0, { timeout: 1500 });
  await expect(page.locator("#hero-title")).toBeFocused();
  await unlocked(page);
});
test("reduced motion bypasses the long opening", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(overlay(page)).toHaveCount(0, { timeout: 1500 });
  await unlocked(page);
});
test("audio stays opt-in and remains synchronized after skip", async ({
  page,
}) => {
  await page.goto("/");
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toHaveAttribute("data-state", "playing");
  await expect(
    overlay(page).getByRole("button", { name: /SOM OFF/ }),
  ).toHaveAttribute("aria-pressed", "false");
  await overlay(page)
    .getByRole("button", { name: /SOM OFF/ })
    .click();
  await expect(
    overlay(page).getByRole("button", { name: /SOM ON/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await overlay(page)
    .getByRole("button", { name: /Pular intro/i })
    .click();
  await expect(overlay(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /SOM ON/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("changing motion preference releases an active opening", async ({
  page,
}) => {
  await page.goto("/");
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toHaveAttribute("data-state", "playing");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await unlocked(page);
});

test("animation chunk failure falls back to the usable page", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let blocked = false;
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (
      body.includes("gsap.registerPlugin") &&
      (body.includes("GreenSock") || body.includes("GSAP"))
    ) {
      blocked = true;
      await route.abort();
    } else await route.fulfill({ response, body });
  });
  await page.goto("/");
  await unlocked(page);
  expect(blocked).toBe(true);
  expect(errors).toEqual([]);
});

test("escape skips and the focus loop stays inside the opening", async ({
  page,
}) => {
  await page.goto("/");
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toHaveAttribute("data-state", "playing");
  await expect(
    overlay(page).getByRole("button", { name: /Pular intro/i }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    overlay(page).getByRole("button", { name: /SOM OFF/ }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    overlay(page).getByRole("button", { name: /Pular intro/i }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await unlocked(page);
});

test("server-rendered boot covers the hero before hydration", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(overlay(page)).toHaveAttribute("data-state", "idle");
    await expect(page.locator(".opening-boot")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          !!document
            .elementFromPoint(innerWidth / 2, innerHeight / 2)
            ?.closest(".cinematic-opening"),
      ),
    ).toBe(true);
  } finally {
    release();
  }
  await expect(overlay(page)).toHaveAttribute("data-state", "playing");
  await overlay(page)
    .getByRole("button", { name: /Pular intro/i })
    .click();
  await unlocked(page);
});

test("without JavaScript the portfolio remains accessible", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(process.env.TEST_BASE_URL ?? "http://localhost:3000");
    await expect(page.locator(".cinematic-opening")).toBeHidden();
    await expect(
      page.getByRole("link", { name: /Ver projetos/ }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
