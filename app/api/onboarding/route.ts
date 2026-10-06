import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { requestUrl } from "@/lib/request-url";

const inputSchema = z.object({
  ownerName: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres.").max(100, "O nome deve ter no máximo 100 caracteres."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128, "A senha deve ter no máximo 128 caracteres."),
  organizationName: z.string().trim().min(2, "Informe o nome do pet shop.").max(120, "O nome do pet shop deve ter no máximo 120 caracteres."),
  storeName: z.string().trim().min(2, "Informe o nome da primeira loja.").max(120, "O nome da loja deve ter no máximo 120 caracteres."),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isNativeForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const input = isNativeForm ? Object.fromEntries(await request.formData()) : await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    if (isNativeForm) return Response.redirect(requestUrl(request, "/criar-conta?erro=validacao"), 303);
    return Response.json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Revise os campos destacados e tente novamente.",
        fields: parsed.error.flatten().fieldErrors,
      },
    }, { status: 422 });
  }

  const data = parsed.data;
  try {
    const result = await db.$transaction(async (tx) => {
      const password = await hashPassword(data.password);
      const user = await tx.user.create({
        data: { name: data.ownerName, email: data.email },
      });
      await tx.account.create({
        data: { userId: user.id, accountId: user.id, providerId: "credential", password },
      });

      const baseSlug = slugify(data.organizationName) || "pet-shop";
      const organization = await tx.organization.create({
        data: { name: data.organizationName, slug: `${baseSlug}-${user.id.slice(-6)}` },
      });
      const store = await tx.store.create({
        data: { organizationId: organization.id, name: data.storeName, slug: slugify(data.storeName) || "loja" },
      });
      const membership = await tx.membership.create({
        data: { organizationId: organization.id, userId: user.id, role: "OWNER" },
      });
      await tx.storeAccess.create({
        data: { membershipId: membership.id, userId: user.id, storeId: store.id },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: organization.id,
          storeId: store.id,
          actorId: user.id,
          action: "organization.onboarded",
          entityType: "Organization",
          entityId: organization.id,
        },
      });
      return { userId: user.id, organizationId: organization.id, storeId: store.id };
    });

    if (isNativeForm) return Response.redirect(requestUrl(request, "/entrar?cadastro=sucesso"), 303);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (isNativeForm) return Response.redirect(requestUrl(request, "/criar-conta?erro=conflito"), 303);
      return Response.json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Este e-mail já está cadastrado. Entre com sua conta ou use outro e-mail.",
        },
      }, { status: 409 });
    }
    getLogger().error({ err: error }, "onboarding failed");
    if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
      if (isNativeForm) return Response.redirect(requestUrl(request, "/criar-conta?erro=indisponivel"), 303);
      return Response.json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "O serviço está temporariamente indisponível. Aguarde alguns minutos e tente novamente.",
        },
      }, { status: 503 });
    }
    if (isNativeForm) return Response.redirect(requestUrl(request, "/criar-conta?erro=inesperado"), 303);
    return Response.json({
      error: {
        code: "ONBOARDING_FAILED",
        message: "Não foi possível criar a conta agora. Tente novamente.",
      },
    }, { status: 500 });
  }
}
