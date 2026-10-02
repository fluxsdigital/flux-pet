import { expect, test } from "@playwright/test";

test("offers a public read-only demonstration without database access", async ({ page }, testInfo) => {
  await page.goto("/demonstracao");
  await expect(page.getByText("Ambiente de demonstração · dados fictícios · somente leitura")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Veja como está seu negócio/ })).toBeVisible();
  await expect(page.getByText("Faturamento", { exact: true })).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("demo-dashboard.png") });

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "PDV" }).last().click();
  await expect(page.getByRole("heading", { name: "PDV" })).toBeVisible();
  await expect(page.getByText("Somente leitura", { exact: true })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Estoque" }).last().click();
  await expect(page.getByRole("heading", { name: "Estoque" })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Cadastros" }).last().click();
  await expect(page.getByRole("heading", { name: "Cadastros" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo cadastro" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
