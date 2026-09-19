import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

const inputSchema = z.object({
  ownerName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(128),
  organizationName: z.string().trim().min(2).max(120),
  storeName: z.string().trim().min(2).max(120),
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
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
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

    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Não foi possível criar a conta com estes dados" }, { status: 409 });
    }
    throw error;
  }
}
