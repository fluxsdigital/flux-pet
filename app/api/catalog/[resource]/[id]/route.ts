import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { createSchemas, parseResource, validateCategory } from "@/lib/catalog";
import { db } from "@/lib/db";

type Context = { params: Promise<{ resource: string; id: string }> };
const statusSchema = z.object({ status: z.enum(["ACTIVE", "INACTIVE"]).optional() });

async function findScoped(resource: ReturnType<typeof parseResource>, id: string, organizationId: string, storeIds: string[]) {
  const where = { id, organizationId, storeId: { in: storeIds } };
  switch (resource) {
    case "categories": return db.category.findFirst({ where });
    case "products": return db.product.findFirst({ where, include: { category: true } });
    case "suppliers": return db.supplier.findFirst({ where });
    case "customers": return db.customer.findFirst({ where });
    case "services": return db.service.findFirst({ where, include: { category: true } });
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const access = await getAccessContext(request);
    const { resource: raw, id } = await context.params;
    const entity = await findScoped(parseResource(raw), id, access.organizationId, access.storeIds);
    if (!entity) throw new AccessError(404, "Cadastro não encontrado");
    return Response.json(entity);
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "STOCK", "CASHIER"]);
    const { resource: raw, id } = await context.params;
    const resource = parseResource(raw);
    const current = await findScoped(resource, id, access.organizationId, access.storeIds);
    if (!current) throw new AccessError(404, "Cadastro não encontrado");
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length === 0) {
      return Response.json({ error: "Dados inválidos" }, { status: 422 });
    }
    const categoryPatch = z.object({ categoryId: z.string().nullable().optional() }).passthrough().safeParse(body);
    if (categoryPatch.success && "categoryId" in body) {
      await validateCategory(db, categoryPatch.data.categoryId, access.organizationId, current.storeId);
    }

    const updated = await db.$transaction(async (tx) => {
      let entity: { id: string };
      switch (resource) {
        case "categories": entity = await tx.category.update({ where: { id }, data: statusSchema.merge(createSchemas.categories.omit({ storeId: true }).partial()).parse(body) }); break;
        case "products": entity = await tx.product.update({ where: { id }, data: statusSchema.merge(createSchemas.products.omit({ storeId: true }).partial()).parse(body) }); break;
        case "suppliers": entity = await tx.supplier.update({ where: { id }, data: statusSchema.merge(createSchemas.suppliers.omit({ storeId: true }).partial()).parse(body) }); break;
        case "customers": entity = await tx.customer.update({ where: { id }, data: statusSchema.merge(createSchemas.customers.omit({ storeId: true }).partial()).parse(body) }); break;
        case "services": entity = await tx.service.update({ where: { id }, data: statusSchema.merge(createSchemas.services.omit({ storeId: true }).partial()).parse(body) }); break;
      }
      await tx.auditEvent.create({ data: {
        organizationId: access.organizationId,
        storeId: current.storeId,
        actorId: access.session.user.id,
        action: `${resource}.updated`,
        entityType: resource,
        entityId: id,
        metadata: { fields: Object.keys(body) },
      } });
      return entity;
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Dados inválidos", fields: error.flatten().fieldErrors }, { status: 422 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Já existe um cadastro com este identificador" }, { status: 409 });
    }
    return accessErrorResponse(error);
  }
}
