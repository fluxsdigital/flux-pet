export function requestUrl(request: Request, path: string) {
  const current = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto") ?? current.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? current.host;
  return new URL(path, `${protocol}://${host}`);
}
