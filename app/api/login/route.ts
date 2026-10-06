import { auth } from "@/lib/auth";
import { requestUrl } from "@/lib/request-url";

function errorRedirect(request: Request, status: number) {
  const error = status === 401 ? "credenciais"
    : status === 403 ? "origem"
      : status === 429 ? "limite"
        : "indisponivel";
  return Response.redirect(requestUrl(request, `/entrar?erro=${error}`), 303);
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return errorRedirect(request, 400);

  const response = await auth.api.signInEmail({
    body: {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    },
    headers: request.headers,
    asResponse: true,
  });
  if (!response.ok) return errorRedirect(request, response.status);

  const headers = new Headers({ location: requestUrl(request, "/sistema").toString() });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) headers.set("set-cookie", setCookie);
  return new Response(null, { status: 303, headers });
}
