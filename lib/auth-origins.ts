function origin(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}
export function getTrustedOrigins() {
  const configured = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((value) => origin(value.trim()))
    .filter((value): value is string => Boolean(value));
  const base = origin(process.env.BETTER_AUTH_URL);

  if (process.env.NODE_ENV !== "production") {
    const port = base ? new URL(base).port || (base.startsWith("https:") ? "443" : "80") : "3000";
    configured.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
  }

  return [...new Set([base, ...configured].filter((value): value is string => Boolean(value)))];
}
