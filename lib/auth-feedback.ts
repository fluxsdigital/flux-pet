export type FieldErrors = Partial<Record<"ownerName" | "organizationName" | "storeName" | "email" | "password", string>>;

export type ApiErrorPayload = {
  error?: string | {
    code?: string;
    message?: string;
    fields?: Record<string, string[] | undefined>;
  };
};

export function onboardingError(payload: ApiErrorPayload, status: number) {
  const error = typeof payload.error === "object" ? payload.error : undefined;
  const fields = Object.fromEntries(
    Object.entries(error?.fields ?? {}).flatMap(([name, messages]) => messages?.[0] ? [[name, messages[0]]] : []),
  ) as FieldErrors;

  if (error?.message) return { message: error.message, fields };
  if (status === 409) return { message: "Este e-mail já está cadastrado. Entre com sua conta ou use outro e-mail.", fields };
  if (status === 422) return { message: "Revise os campos destacados e tente novamente.", fields };
  if (status === 503) return { message: "O serviço está temporariamente indisponível. Aguarde alguns minutos e tente novamente.", fields };
  return { message: "Não foi possível criar a conta agora. Tente novamente.", fields };
}
export function loginError(error: { code?: string; status?: number; statusCode?: number } | null | undefined) {
  const status = error?.status ?? error?.statusCode;
  if (error?.code === "INVALID_EMAIL_OR_PASSWORD" || status === 401) {
    return "E-mail ou senha inválidos. Confira os dados e tente novamente.";
  }
  if (error?.code === "INVALID_EMAIL" || status === 400 || status === 422) {
    return "Informe um e-mail válido e tente novamente.";
  }
  if (status === 429) return "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.";
  if (status && status >= 500) return "O serviço de acesso está temporariamente indisponível. Tente novamente em alguns minutos.";
  return "Não foi possível entrar agora. Verifique sua conexão e tente novamente.";
}
