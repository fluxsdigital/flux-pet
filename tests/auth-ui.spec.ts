import { expect, test } from "@playwright/test";

import { cleanupTenantByEmail, disconnectTestDatabase } from "./helpers/tenant-cleanup";

const createdEmails = new Set<string>();

test.afterAll(async () => {
  for (const email of createdEmails) {
    await cleanupTenantByEmail(email);
  }
  await disconnectTestDatabase();
});

test("shows the responsive sign-in and onboarding forms", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();

  await page.goto("/criar-conta");
  await expect(page.getByRole("heading", { name: "Crie seu workspace" })).toBeVisible();
  await expect(page.getByLabel("Nome do pet shop")).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar workspace" })).toBeVisible();
});

test("redirects unauthenticated system access to sign-in", async ({ page }) => {
  await page.goto("/sistema");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("supports native signup and login before client hydration", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: testInfo.project.use.viewport,
  });
  const page = await context.newPage();
  await page.goto("/criar-conta");

  const suffix = `${Date.now()}-native-${testInfo.project.name}`.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const email = `${suffix}@example.test`;
  const password = "senha-nativa-segura-2026";
  createdEmails.add(email);
  await expect(page.getByRole("button", { name: "Criar workspace" })).toBeEnabled();
  await expect(page.locator("form")).toHaveAttribute("method", "post");
  await page.getByLabel("Seu nome").fill("Dono sem JavaScript");
  await page.getByLabel("Nome do pet shop").fill(`Pet Nativo ${suffix}`);
  await page.getByLabel("Nome da primeira loja").fill("Loja Nativa");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(page).toHaveURL(/\/entrar\?cadastro=sucesso$/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/);
  await expect(page.getByText(`Pet Nativo ${suffix}`, { exact: true })).toBeVisible();
  await context.close();
});

test("creates a workspace, redirects to login, authenticates and grants system access", async ({ page }, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.project.name}`.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const email = `e2e-${suffix}@example.test`;
  const password = "senha-local-segura-2026";
  createdEmails.add(email);

  await page.goto("/criar-conta");
  await page.getByLabel("Seu nome").fill("Dono E2E");
  await page.getByLabel("Nome do pet shop").fill(`Pet Shop ${suffix}`);
  await page.getByLabel("Nome da primeira loja").fill("Loja Centro");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar workspace" }).click();

  await expect(page).toHaveURL(/\/entrar\?cadastro=sucesso$/);
  await expect(page.getByRole("status")).toContainText("Workspace criado com sucesso");

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();

  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/sistema$/);
  await expect(page.getByText(`Pet Shop ${suffix}`, { exact: true })).toBeVisible();
});

test("shows actionable and accessible onboarding validation", async ({ page }) => {
  await page.goto("/criar-conta");
  await page.getByLabel("Seu nome").fill("A");
  await page.getByLabel("Nome do pet shop").fill("P");
  await page.getByLabel("Nome da primeira loja").fill("L");
  await page.getByLabel("E-mail").fill("email-invalido");
  await page.getByLabel("Senha").fill("curta");
  await page.getByRole("button", { name: "Criar workspace" }).click();

  await expect(page.getByText("Revise os campos destacados e tente novamente.")).toBeVisible();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("A senha deve ter pelo menos 10 caracteres.")).toBeVisible();
});
