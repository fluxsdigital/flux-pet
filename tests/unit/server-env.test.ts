import { describe, expect, it } from "vitest";
import { parseServerEnv } from "../../lib/config/server-env";

describe("server environment", () => {
  it("accepts the explicit local contract", () => {
    expect(parseServerEnv({
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5434/flux_pet",
    })).toMatchObject({
      APP_ENV: "development",
      APP_TIMEZONE: "America/Sao_Paulo",
      LOG_LEVEL: "info",
    });
  });

  it("rejects a non-PostgreSQL database", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://localhost/db" })).toThrow();
  });
});
