import { CatalogStatus, Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { createSchemas, listQuery, parseResource, validateCategory } from "@/lib/catalog";
import { db } from "@/lib/db";

type Context = { params: Promise<{ resource: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const access = await getAccessContext(request);
    const resource = parseResource((await context.params).resource);
    const query = listQuery(request.url, access.storeIds);
    const where = {
      organizationId: access.organizationId,
      storeId: { in: query.storeIds },
      status: query.status as CatalogStatus | undefined,
      name: query.q ? { contains: query.q, mode: Prisma.QueryMode.insensitive } : undefined,
    };
    const options = { where, orderBy: { name: Prisma.SortOrder.asc }, skip: query.skip, take: query.pageSize };
    const [data, total] = await (async () => {
      switch (resource) {
        case "categories": return Promise.all([db.category.findMany(options), db.category.count({ where })]);
        case "products": return Promise.all([db.product.findMany({ ...options, include: { category: true } }), db.product.count({ where })]);
        case "suppliers": return Promise.all([db.supplier.findMany(options), db.supplier.count({ where })]);
        case "customers": return Promise.all([db.customer.findMany(options), db.customer.count({ where })]);
        case "services": return Promise.all([db.service.findMany({ ...options, include: { category: true } }), db.service.count({ where })]);
      }
    })();
    return Response.json({ data, pagination: { page: query.page, pageSize: query.pageSize, total } });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "STOCK", "CASHIER"]);
    const resource = parseResource((await context.params).resource);
    const body: unknown = await request.json().catch(() => null);
    const parsed = createSchemas[resource].safeParse(body);
    if (!parsed.success) return Response.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    const input = parsed.data;
    if (!access.storeIds.includes(input.storeId)) throw new AccessError(404, "Loja não encontrada");
    if ("categoryId" in input) await validateCategory(db, input.categoryId, access.organizationId, input.storeId);

    const created = await db.$transaction(async (tx) => {
      let entity: { id: string };
      switch (resource) {
        case "categories": {
          const data = createSchemas.categories.parse(body);
          entity = await tx.category.create({ data: { ...data, organizationId: access.organizationId } });
          break;
        }
        case "products": {
          const data = createSchemas.products.parse(body);
          entity = await tx.product.create({ data: { ...data, organizationId: access.organizationId } });
          break;
        }
        case "suppliers": {
          const data = createSchemas.suppliers.parse(body);
          entity = await tx.supplier.create({ data: { ...data, organizationId: access.organizationId } });
          break;
        }
        case "customers": {
          const data = createSchemas.customers.parse(body);
          entity = await tx.customer.create({ data: { ...data, organizationId: access.organizationId } });
          break;
        }
        case "services": {
          const data = createSchemas.services.parse(body);
          entity = await tx.service.create({ data: { ...data, organizationId: access.organizationId } });
          break;
        }
      }
      await tx.auditEvent.create({ data: {
        organizationId: access.organizationId,
        storeId: input.storeId,
        actorId: access.session.user.id,
        action: `${resource}.created`,
        entityType: resource,
        entityId: entity.id,
      } });
      return entity;
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Já existe um cadastro com este identificador" }, { status: 409 });
    }
    return accessErrorResponse(error);
  }
}
