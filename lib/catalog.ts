import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { AccessError } from "@/lib/access";

export const resources = ["categories", "products", "suppliers", "customers", "services"] as const;
export type CatalogResource = (typeof resources)[number];

const base = z.object({
  storeId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
});

export const createSchemas = {
  categories: base.extend({ slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/) }),
  products: base.extend({
    categoryId: z.string().optional().nullable(),
    sku: z.string().trim().min(1).max(80),
    barcode: z.string().trim().max(80).optional().nullable(),
    unit: z.enum(["UNIT", "KILOGRAM", "GRAM", "LITER", "MILLILITER", "PACKAGE"]).default("UNIT"),
    salePrice: z.coerce.number().min(0).max(999999999999.99),
    referenceCost: z.coerce.number().min(0).max(999999999999.99),
    taxNotes: z.string().trim().max(500).optional().nullable(),
  }),
  suppliers: base.extend({
    document: z.string().trim().max(32).optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    phone: z.string().trim().max(32).optional().nullable(),
  }),
  customers: base.extend({
    document: z.string().trim().max(32).optional().nullable(),
    email: z.string().trim().email().optional().nullable(),
    phone: z.string().trim().max(32).optional().nullable(),
    petName: z.string().trim().max(120).optional().nullable(),
  }),
  services: base.extend({
    categoryId: z.string().optional().nullable(),
    code: z.string().trim().min(1).max(80),
    salePrice: z.coerce.number().min(0).max(999999999999.99),
    estimatedCost: z.coerce.number().min(0).max(999999999999.99),
    durationMinutes: z.coerce.number().int().positive().max(1440).optional().nullable(),
  }),
} as const;

export function parseResource(value: string): CatalogResource {
  if (!(resources as readonly string[]).includes(value)) throw new AccessError(404, "Recurso não encontrado");
  return value as CatalogResource;
}

export async function validateCategory(
  db: PrismaClient,
  categoryId: string | null | undefined,
  organizationId: string,
  storeId: string,
) {
  if (!categoryId) return;
  const exists = await db.category.count({ where: { id: categoryId, organizationId, storeId } });
  if (!exists) throw new AccessError(404, "Categoria não encontrada");
}

export function listQuery(url: string, allowedStoreIds: string[]) {
  const params = new URL(url).searchParams;
  const page = Math.max(1, Number(params.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") || 20)));
  const requestedStore = params.get("storeId");
  if (requestedStore && !allowedStoreIds.includes(requestedStore)) throw new AccessError(404, "Loja não encontrada");
  const status = params.get("status");
  return {
    q: params.get("q")?.trim() || undefined,
    storeIds: requestedStore ? [requestedStore] : allowedStoreIds,
    status: status === "ACTIVE" || status === "INACTIVE" ? status : undefined,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
  };
}
