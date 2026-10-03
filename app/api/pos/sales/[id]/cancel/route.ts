import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { applyStockMovement } from "@/lib/stock";

const schema = z.object({ reason: z.string().trim().min(5).max(500) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Motivo inválido" }, { status: 422 });
    const { id } = await context.params;
    const canceled = await db.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, organizationId: access.organizationId, storeId: { in: access.storeIds } }, include: { items: true, cancellation: true } });
      if (!sale) throw new AccessError(404, "Venda não encontrada");
      if (sale.status === "CANCELED") return sale;
      if (sale.status !== "CONFIRMED") throw new AccessError(403, "Venda com devolução não pode ser cancelada integralmente");
      for (const item of sale.items) if (item.productId) await applyStockMovement(tx, {
        organizationId: access.organizationId, storeId: sale.storeId, productId: item.productId,
        type: "SALE_REVERSAL", quantity: item.quantity, unitCost: item.unitCostSnapshot,
        actorId: access.session.user.id, referenceType: "SaleCancellation", referenceId: sale.id,
      });
      await tx.saleCancellation.create({ data: { saleId: sale.id, reason: parsed.data.reason, actorId: access.session.user.id } });
      await tx.accountReceivable.updateMany({ where: { saleId: sale.id, status: "OPEN" }, data: { status: "CANCELED" } });
      await tx.auditEvent.create({ data: { organizationId: access.organizationId, storeId: sale.storeId, actorId: access.session.user.id, action: "sale.canceled", entityType: "Sale", entityId: sale.id, metadata: { reason: parsed.data.reason } } });
      return tx.sale.update({ where: { id: sale.id }, data: { status: "CANCELED", canceledAt: new Date() }, include: { items: true, payments: true, cancellation: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json(canceled);
  } catch (error) { return accessErrorResponse(error); }
}
