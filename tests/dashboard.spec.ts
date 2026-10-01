import { expect, test } from "@playwright/test";

test("renders the authenticated executive dashboard responsively", async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  await page.goto("/criar-conta");
  await page.getByLabel("Seu nome").fill("Jieff Demo");
  await page.getByLabel("Nome do pet shop").fill("Flux Pet Demo");
  await page.getByLabel("Nome da primeira loja").fill("Loja Centro");
  await page.getByLabel("E-mail").fill(`dashboard-${suffix}@example.test`);
  await page.getByLabel("Senha").fill("DemoSegura123!");
  await page.getByRole("button", { name: "Criar workspace" }).click();

  await expect(page).toHaveURL(/\/sistema$/);
  await expect(page.getByRole("heading", { name: /Veja como está seu negócio/ })).toBeVisible();
  await expect(page.getByText("Margem de contribuição", { exact: true })).toBeVisible();
  await expect(page.getByText("Ponto de equilíbrio", { exact: true })).toBeVisible();
  await expect(page.getByText("Saúde do estoque", { exact: true })).toBeVisible();
  await expect(page.getByText("Alertas e recomendações", { exact: true })).toBeVisible();

  await page.getByLabel("Período").selectOption("7d");
  await expect(page.getByText("R$ 18.740", { exact: true })).toBeVisible();
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("dashboard-populated.png") });
  await page.getByRole("button", { name: "Ver estado vazio" }).click();
  await expect(page.getByRole("heading", { name: "Seu painel começa com a primeira venda" })).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("navigation", { name: "Navegação do sistema" }).last()).toBeVisible();
  }

  await page.screenshot({ fullPage: true, path: testInfo.outputPath("dashboard-empty.png") });
});
