import { expect, test } from "@playwright/test";

test("offers a public demonstration without database access", async ({ page }, testInfo) => {
  await page.goto("/demonstracao");
  await expect(page.getByText("Ambiente de demonstração · dados fictícios · nenhuma operação é real")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Veja como está seu negócio/ })).toBeVisible();
  await expect(page.getByText("Faturamento", { exact: true })).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("demo-dashboard.png") });

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "PDV" }).last().click();
  await expect(page.getByRole("heading", { name: "PDV demonstrativo" })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Estoque" }).last().click();
  await expect(page.getByRole("heading", { name: "Estoque demonstrativo" })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Cadastros" }).last().click();
  await expect(page.getByRole("heading", { name: "Cadastros" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo cadastro" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("completes a fictitious sale", async ({ page }) => {
  await page.goto("/demonstracao/pdv");
  await page.getByPlaceholder("Buscar por produto ou SKU").fill("shampoo");
  await page.getByRole("button", { name: /Adicionar/ }).click();
  await page.getByRole("button", { name: /Aumentar Shampoo/ }).click();
  await page.getByText("Cartão", { exact: true }).click();
  await expect(page.getByText("R$ 59,80", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Concluir venda demonstrativa" }).click();
  await expect(page.getByRole("heading", { name: "Venda demonstrativa concluída!" })).toBeVisible();
  await expect(page.locator("p", { hasText: "2 itens · Cartão · R$ 59,80" })).toBeVisible();
});

test("validates and adds a fictitious stock product", async ({ page }) => {
  await page.goto("/demonstracao/estoque");
  await page.getByRole("button", { name: "Novo produto" }).click();
  await page.getByRole("button", { name: "Cadastrar na demo" }).click();
  await expect(page.getByText("Informe um nome com pelo menos 3 caracteres.")).toBeVisible();
  await page.getByLabel("Nome do produto").fill("Coleira Conforto");
  await page.getByLabel("SKU").fill("ACE-777");
  await page.getByLabel("Categoria").selectOption("Acessórios");
  await page.getByLabel("Quantidade inicial").fill("12");
  await page.getByLabel("Preço de venda (R$)").fill("39.90");
  await page.getByRole("button", { name: "Cadastrar na demo" }).click();
  await expect(page.getByText("Coleira Conforto foi adicionado ao estoque demonstrativo.")).toBeVisible();
  await expect(page.getByRole("cell", { name: /Coleira Conforto/ })).toBeVisible();
});
