import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { applyStockMovement } from "@/lib/stock";

const schema = z.object({ reason: z.string().trim().min(5).max(500), items: z.array(z.object({ saleItemId: z.string(), quantity: z.coerce.number().positive() })).min(1) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 422 });
    const { id } = await context.params;
    const result = await db.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({ where: { id, organizationId: access.organizationId, storeId: { in: access.storeIds }, status: { not: "CANCELED" } }, include: { items: { include: { returnItems: true } } } });
      if (!sale) throw new AccessError(404, "Venda não encontrada");
      const rows: Array<{ saleItemId: string; quantity: Prisma.Decimal; amount: Prisma.Decimal }> = [];
      for (const requested of parsed.data.items) {
        const item = sale.items.find((candidate) => candidate.id === requested.saleItemId);
        if (!item) throw new AccessError(404, "Item da venda não encontrado");
        const returned = item.returnItems.reduce((sum, entry) => sum.add(entry.quantity), new Prisma.Decimal(0));
        const quantity = new Prisma.Decimal(requested.quantity);
        if (returned.add(quantity).gt(item.quantity)) throw new AccessError(403, "Quantidade devolvida excede a venda");
        const amount = item.netTotal.div(item.quantity).mul(quantity).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        rows.push({ saleItemId: item.id, quantity, amount });
      }
      const amount = rows.reduce((sum, row) => sum.add(row.amount), new Prisma.Decimal(0));
      const saleReturn = await tx.saleReturn.create({ data: { saleId: sale.id, reason: parsed.data.reason, amount, actorId: access.session.user.id, items: { create: rows } }, include: { items: true } });
      for (const row of rows) {
        const item = sale.items.find((candidate) => candidate.id === row.saleItemId)!;
        if (item.productId) await applyStockMovement(tx, { organizationId: access.organizationId, storeId: sale.storeId, productId: item.productId, type: "RETURN", quantity: row.quantity, unitCost: item.unitCostSnapshot, actorId: access.session.user.id, referenceType: "SaleReturn", referenceId: saleReturn.id });
      }
      await tx.sale.update({ where: { id: sale.id }, data: { status: "PARTIALLY_RETURNED" } });
      await tx.auditEvent.create({ data: { organizationId: access.organizationId, storeId: sale.storeId, actorId: access.session.user.id, action: "sale.returned", entityType: "Sale", entityId: sale.id, metadata: { returnId: saleReturn.id, amount: amount.toString() } } });
      return saleReturn;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json(result, { status: 201 });
  } catch (error) { return accessErrorResponse(error); }
}
