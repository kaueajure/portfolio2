import { test, expect, type Page } from "@playwright/test";
const overlay = (page: Page) =>
  page.getByRole("dialog", { name: "Abertura do portfólio" });
for (const width of [1440, 768, 390, 320]) {
  test(`intro concludes and replays on refresh at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(overlay(page)).toBeVisible();
    await expect(overlay(page)).toHaveAttribute("data-state", "playing");
    const preview = page.locator("#portfolio-page[data-opening-reveal]");
    await expect(preview).toHaveCSS("opacity", "1");
    const previewTitle = await preview.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const title = element
        .querySelector("#hero-title")!
        .getBoundingClientRect();
      const scale = box.width / element.clientWidth;
      return {
        x: (title.x - box.x) / scale,
        y: (title.y - box.y) / scale,
        width: title.width / scale,
        height: title.height / scale,
        pageHeight: element.clientHeight,
        viewportHeight: innerHeight,
      };
    });
    expect(previewTitle.pageHeight).toBe(previewTitle.viewportHeight);
    await expect(page.locator("#hero-title")).toHaveCount(1);
    if (width === 1440 || width === 390)
      await page.screenshot({ path: testInfo.outputPath("preview.png") });
    const handoff = await page.evaluate(
      () =>
        new Promise<{ before: number[]; after: number[] }>((resolve) => {
          let before: number[] = [];
          const sample = () => {
            const box = document
              .getElementById("hero-title")!
              .getBoundingClientRect();
            const bounds = [box.x, box.y, box.width, box.height];
            if (document.documentElement.hasAttribute("data-opening-lock")) {
              before = bounds;
              requestAnimationFrame(sample);
            } else resolve({ before, after: bounds });
          };
          sample();
        }),
    );
    await expect(overlay(page)).toBeHidden({ timeout: 12000 });
    handoff.after.forEach((value, index) =>
      expect(Math.abs(value - handoff.before[index])).toBeLessThan(1),
    );
    const title = await page.locator("#hero-title").boundingBox();
    for (const key of ["x", "y", "width", "height"] as const)
      expect(Math.abs(title![key] - previewTitle[key])).toBeLessThan(1);
    await expect(page.locator("#hero-title")).not.toBeFocused();
    await expect(page.locator("#portfolio-page")).not.toHaveAttribute("style");
    await expect(page.locator("#portfolio-page")).not.toHaveAttribute("inert");
    if (width === 1440 || width === 390)
      await page.screenshot({ path: testInfo.outputPath("final.png") });
    await expect(page.locator("html")).not.toHaveAttribute("data-opening-lock");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await expect(overlay(page)).toBeVisible();
    await expect(overlay(page)).toHaveAttribute("data-state", "playing");
    await expect(overlay(page)).toBeHidden({ timeout: 12000 });
    await expect(
      page.getByRole("link", { name: /Ver projetos/ }),
    ).toBeVisible();
  });
}
test("skip and Escape release focus and scrolling", async ({ page }) => {
  await page.goto("/");
  await expect(
    overlay(page).getByRole("button", { name: /Pular intro/ }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(overlay(page)).toBeHidden();
  await expect(page.locator("#inicio")).toBeFocused();
  await expect(page.locator("#inicio")).toHaveCSS("outline-style", "none");
  await page.getByRole("button", { name: "Rever abertura" }).click();
  await expect(overlay(page)).toBeVisible();
  await expect(page).toHaveURL(/#inicio$/);
  await expect(page.locator("#portfolio-page[data-opening-reveal]")).toHaveCSS(
    "opacity",
    "1",
  );
  await overlay(page)
    .getByRole("button", { name: /Pular intro/ })
    .click();
  await expect(overlay(page)).toBeHidden();
  await expect(page.locator("#hero-title")).not.toBeFocused();
  await expect(page.locator("#portfolio-page")).not.toHaveAttribute("style");
  await expect(page.locator("html")).not.toHaveAttribute("data-opening-lock");
});
test("audio remains opt-in across skip", async ({ page }) => {
  await page.goto("/");
  const sound = overlay(page).getByRole("button", { name: /SOM OFF/ });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(
    overlay(page).getByRole("button", { name: /SOM ON/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await overlay(page)
    .getByRole("button", { name: /Pular intro/ })
    .click();
  await expect(overlay(page)).toBeHidden();
  await expect(page.getByRole("button", { name: /SOM ON/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("hash entry respects destination and history", async ({ page }) => {
  await page.goto("/#contato");
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toBeHidden({ timeout: 12000 });
  await expect
    .poll(() =>
      page
        .locator("#contato")
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(250);
  await page.reload();
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toBeHidden({ timeout: 12000 });
  await expect
    .poll(() =>
      page
        .locator("#contato")
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(250);
});
test("reduced motion and no JavaScript show the portfolio", async ({
  browser,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(overlay(page)).toBeHidden();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await context.newPage();
  await noJs.goto("/");
  await expect(noJs.locator(".cinematic-opening")).toBeHidden();
  await expect(noJs.getByRole("link", { name: /Ver projetos/ })).toBeVisible();
  await context.close();
});
test("mobile menu has coherent focus order and closes on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#inicio");
  await expect(overlay(page)).toBeHidden({ timeout: 12000 });
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await expect(
    page.getByRole("link", { name: "Projetos", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Contato" })
    .click();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page).toHaveURL(/#contato$/);
});
test("cases use internal routes and private projects have no repository link", async ({
  page,
}) => {
  await page.goto("/#projetos");
  await expect(overlay(page)).toBeHidden({ timeout: 12000 });
  await page.getByRole("link", { name: "Alonso", exact: true }).click();
  await expect(page).toHaveURL(/\/projetos\/alonso$/);
  await expect(
    page.getByRole("heading", { name: "Alonso", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver código público" }),
  ).toHaveCount(0);
  await page.goto("/projetos/gestifique");
  await expect(
    page.getByRole("link", { name: "Ver código público" }),
  ).toHaveAttribute("href", "https://github.com/kaueajure/gestifique");
});
