import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { applyStockMovement } from "@/lib/stock";

const schema = z.object({
  storeId: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ productId: z.string().min(1), countedQuantity: z.coerce.number().min(0) })).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId || !access.storeIds.includes(storeId)) throw new AccessError(404, "Loja não encontrada");
    return Response.json({ data: await db.inventoryCount.findMany({
      where: { organizationId: access.organizationId, storeId },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
      orderBy: { createdAt: "desc" },
    }) });
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
    if (new Set(parsed.data.items.map((item) => item.productId)).size !== parsed.data.items.length) {
      return Response.json({ error: "Produto duplicado no inventário" }, { status: 422 });
    }

    const inventory = await db.$transaction(async (tx) => {
      const count = await tx.inventoryCount.create({ data: {
        organizationId: access.organizationId,
        storeId: parsed.data.storeId,
        status: "DRAFT",
        notes: parsed.data.notes,
        actorId: access.session.user.id,
      } });
      for (const item of parsed.data.items) {
        const product = await tx.product.findFirst({ where: {
          id: item.productId, organizationId: access.organizationId, storeId: parsed.data.storeId,
        } });
        if (!product) throw new AccessError(404, "Produto não encontrado");
        const balance = await tx.stockBalance.findUnique({ where: { productId: product.id } });
        const expected = balance?.quantity ?? new Prisma.Decimal(0);
        const counted = new Prisma.Decimal(item.countedQuantity);
        const difference = counted.sub(expected);
        let adjustmentId: string | undefined;
        if (!difference.eq(0)) {
          const movement = await applyStockMovement(tx, {
            organizationId: access.organizationId,
            storeId: parsed.data.storeId,
            productId: product.id,
            type: difference.gt(0) ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
            quantity: difference.abs(),
            unitCost: difference.gt(0) ? balance?.averageCost ?? product.referenceCost : undefined,
            reason: `Inventário ${count.id}`,
            referenceType: "InventoryCount",
            referenceId: count.id,
            actorId: access.session.user.id,
          });
          adjustmentId = movement.id;
        }
        await tx.inventoryItem.create({ data: {
          inventoryCountId: count.id,
          productId: product.id,
          expectedQuantity: expected,
          countedQuantity: counted,
          adjustmentId,
        } });
      }
      await tx.auditEvent.create({ data: {
        organizationId: access.organizationId,
        storeId: parsed.data.storeId,
        actorId: access.session.user.id,
        action: "inventory.confirmed",
        entityType: "InventoryCount",
        entityId: count.id,
      } });
      return tx.inventoryCount.update({
        where: { id: count.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json(inventory, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
