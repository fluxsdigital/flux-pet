function origin(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isPrivateDevelopmentOrigin(value: string, expectedPort: string) {
  try {
    const url = new URL(value);
    const port = url.port || (url.protocol === "https:" ? "443" : "80");
    const privateHost = url.hostname === "localhost"
      || url.hostname === "127.0.0.1"
      || url.hostname === "[::1]"
      || /^10\./.test(url.hostname)
      || /^192\.168\./.test(url.hostname)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
    return url.protocol === "http:" && port === expectedPort && privateHost;
  } catch {
    return false;
  }
}

export function getTrustedOrigins(request?: Request) {
  const configured = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((value) => origin(value.trim()))
    .filter((value): value is string => Boolean(value));
  const base = origin(process.env.BETTER_AUTH_URL);

  if (process.env.APP_ENV === "development" || process.env.NODE_ENV !== "production") {
    const port = base ? new URL(base).port || (base.startsWith("https:") ? "443" : "80") : "3000";
    configured.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    const requestOrigin = request?.headers.get("origin");
    if (requestOrigin && isPrivateDevelopmentOrigin(requestOrigin, port)) configured.push(requestOrigin);
  }

  return [...new Set([base, ...configured].filter((value): value is string => Boolean(value)))];
}
