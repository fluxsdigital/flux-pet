import { expect, test } from "@playwright/test";

test("publica a landing Next.js componentizada com ícones locais", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.locator("h1")).toContainText("Você sabe");
  await expect(page.locator("main img")).toHaveCount(3);
  await expect(page.locator("#dashboard")).toBeVisible();
  await expect(page.locator("#faq")).toBeVisible();

  const images = page.locator("main img");
  for (const index of [0, 1, 2]) {
    await images.nth(index).scrollIntoViewIfNeeded();
    await expect.poll(() => images.nth(index).evaluate((image) => ({
      complete: (image as HTMLImageElement).complete,
      naturalWidth: (image as HTMLImageElement).naturalWidth,
      src: (image as HTMLImageElement).getAttribute("src"),
    }))).toMatchObject({ complete: true, naturalWidth: 512 });
    await expect(images.nth(index)).toHaveAttribute("src", /^\/stitch\/assets\//);
  }

  const heroCard = page.getByTestId("hero-floating-card");
  await expect(heroCard).toBeVisible();
  expect(await heroCard.evaluate((card) => getComputedStyle(card).animationName)).toBe("floatAlt");

  const iconCheck = await page.locator(".material-symbols-outlined").evaluateAll((icons) =>
    icons.map((icon) => ({
      text: icon.textContent?.trim(),
      font: getComputedStyle(icon).fontFamily,
      width: icon.getBoundingClientRect().width,
    })),
  );
  expect(iconCheck.length).toBeGreaterThan(10);
  expect(iconCheck.every(({ font, width }) => font.includes("Material Symbols Outlined") && width < 48)).toBeTruthy();

  const secondFaq = page.getByRole("button", { name: "O Flux Pet controla estoque?" });
  await secondFaq.click();
  await expect(secondFaq).toHaveAttribute("aria-expanded", "true");
  expect(errors).toEqual([]);
});

for (const removedRoute of ["/acolhedora", "/gestao-inteligente", "/gestao-inteligente-copia"]) {
  test(`${removedRoute} não é mais publicado`, async ({ request }) => {
    expect((await request.get(removedRoute)).status()).toBe(404);
  });
}
