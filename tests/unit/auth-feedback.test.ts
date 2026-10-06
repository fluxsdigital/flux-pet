import { afterEach, describe, expect, it, vi } from "vitest";

import { loginError, onboardingError } from "../../lib/auth-feedback";
import { getTrustedOrigins } from "../../lib/auth-origins";

describe("authentication feedback", () => {
  it("maps validation details without losing field guidance", () => {
    expect(onboardingError({
      error: {
        code: "VALIDATION_ERROR",
        message: "Revise os campos destacados e tente novamente.",
        fields: { email: ["Informe um e-mail válido."] },
      },
    }, 422)).toEqual({
      message: "Revise os campos destacados e tente novamente.",
      fields: { email: "Informe um e-mail válido." },
    });
  });

  it("distinguishes invalid credentials, throttling and server failures", () => {
    expect(loginError({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toContain("E-mail ou senha inválidos");
    expect(loginError({ status: 429 })).toContain("Muitas tentativas");
    expect(loginError({ status: 503 })).toContain("temporariamente indisponível");
    expect(loginError(undefined)).toContain("Verifique sua conexão");
  });
});

describe("trusted authentication origins", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts localhost aliases in development and keeps configured origins", () => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3187");
    vi.stubEnv("BETTER_AUTH_TRUSTED_ORIGINS", "https://pet.example.com");
    vi.stubEnv("NODE_ENV", "development");
    expect(getTrustedOrigins()).toEqual([
      "http://localhost:3187",
      "https://pet.example.com",
      "http://127.0.0.1:3187",
    ]);
  });
});
