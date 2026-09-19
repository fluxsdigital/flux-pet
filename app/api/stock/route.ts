import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { recordStockMovement } from "@/lib/stock";

const schema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  type: z.enum(["INITIAL", "RECEIPT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
  quantity: z.coerce.number().positive().max(99999999999),
  unitCost: z.coerce.number().min(0).optional(),
  reason: z.string().trim().min(3).max(500).optional(),
  lotNumber: z.string().trim().max(80).optional(),
  expiresAt: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    const params = request.nextUrl.searchParams;
    const storeId = params.get("storeId");
    if (!storeId || !access.storeIds.includes(storeId)) throw new AccessError(404, "Loja não encontrada");
    const productId = params.get("productId") || undefined;
    const [balances, movements] = await Promise.all([
      db.stockBalance.findMany({
        where: { organizationId: access.organizationId, storeId, productId },
        include: { product: { select: { name: true, sku: true, unit: true, minimumStock: true } } },
        orderBy: { product: { name: "asc" } },
      }),
      db.stockMovement.findMany({
        where: { organizationId: access.organizationId, storeId, productId },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { occurredAt: "desc" },
        take: 100,
      }),
    ]);
    return Response.json({ balances, movements });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "STOCK"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    if (!access.storeIds.includes(parsed.data.storeId)) throw new AccessError(404, "Loja não encontrada");
    if (parsed.data.type === "ADJUSTMENT_OUT" && !parsed.data.reason) {
      return Response.json({ error: "Ajustes de saída exigem motivo" }, { status: 422 });
    }
    const movement = await recordStockMovement({ ...parsed.data, organizationId: access.organizationId, actorId: access.session.user.id });
    return Response.json(movement, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return Response.json({ error: "Conflito de estoque; tente novamente" }, { status: 409 });
    }
    return accessErrorResponse(error);
  }
}
