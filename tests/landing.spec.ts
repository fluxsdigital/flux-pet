import { expect, test } from "@playwright/test";

test("publica somente a tela atual do Stitch com ícones locais", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const response = await page.goto("/", { waitUntil: "networkidle" });
  expect(response?.ok()).toBeTruthy();

  const frame = page.frameLocator('iframe[title*="Flux Pet"]');
  await expect(frame.locator("h1")).toContainText("Você sabe");
  await expect(frame.locator("main img")).toHaveCount(3);

  const iconCheck = await frame.locator(".material-symbols-outlined").evaluateAll((icons) =>
    icons.map((icon) => ({
      text: icon.textContent?.trim(),
      font: getComputedStyle(icon).fontFamily,
      width: icon.getBoundingClientRect().width,
    })),
  );
  expect(iconCheck.length).toBeGreaterThan(10);
  expect(iconCheck.every(({ font, width }) => font.includes("Material Symbols Outlined") && width < 48)).toBeTruthy();
  expect(errors).toEqual([]);
});

for (const removedRoute of ["/acolhedora", "/gestao-inteligente", "/gestao-inteligente-copia"]) {
  test(`${removedRoute} não é mais publicado`, async ({ request }) => {
    expect((await request.get(removedRoute)).status()).toBe(404);
  });
}
