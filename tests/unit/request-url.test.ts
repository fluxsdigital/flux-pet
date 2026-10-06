import { describe, expect, it } from "vitest";

import { requestUrl } from "../../lib/request-url";

describe("requestUrl", () => {
  it("preserves the browser host behind the local container proxy", () => {
    const request = new Request("http://localhost:3000/api/onboarding", {
      headers: { host: "192.168.100.7:3000", "x-forwarded-proto": "http" },
    });
    expect(requestUrl(request, "/entrar?cadastro=sucesso").toString()).toBe("http://192.168.100.7:3000/entrar?cadastro=sucesso");
  });
});
