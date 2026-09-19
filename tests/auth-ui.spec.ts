import { expect, test } from "@playwright/test";

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
