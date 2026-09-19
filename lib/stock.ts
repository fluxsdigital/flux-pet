import { Prisma, StockMovementType } from "@prisma/client";

import { AccessError } from "@/lib/access";
import { db } from "@/lib/db";

type Transaction = Prisma.TransactionClient;
const inbound = new Set<StockMovementType>(["INITIAL", "RECEIPT", "ADJUSTMENT_IN", "RETURN", "SALE_REVERSAL"]);

export type MovementInput = {
  organizationId: string;
  storeId: string;
  productId: string;
  type: StockMovementType;
  quantity: Prisma.Decimal.Value;
  unitCost?: Prisma.Decimal.Value;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  lotNumber?: string;
  expiresAt?: Date;
  actorId: string;
};

export async function applyStockMovement(tx: Transaction, input: MovementInput) {
  const product = await tx.product.findFirst({
    where: { id: input.productId, organizationId: input.organizationId, storeId: input.storeId, status: "ACTIVE" },
  });
  if (!product) throw new AccessError(404, "Produto não encontrado");

  const quantity = new Prisma.Decimal(input.quantity);
  if (quantity.lte(0)) throw new AccessError(403, "A quantidade deve ser positiva");
  const balance = await tx.stockBalance.findUnique({ where: { productId: product.id } });
  const previousQuantity = balance?.quantity ?? new Prisma.Decimal(0);
  const previousCost = balance?.averageCost ?? product.referenceCost;
  const isInbound = inbound.has(input.type);
  const delta = isInbound ? quantity : quantity.negated();
  const nextQuantity = previousQuantity.add(delta);
  if (nextQuantity.lt(0)) throw new AccessError(403, "Estoque insuficiente");

  let unitCost = previousCost;
  let averageCost = previousCost;
  if (isInbound) {
    if (input.unitCost === undefined && input.type !== "SALE_REVERSAL" && input.type !== "RETURN") {
      throw new AccessError(403, "Informe o custo unitário da entrada");
    }
    unitCost = input.unitCost === undefined ? previousCost : new Prisma.Decimal(input.unitCost);
    if (unitCost.lt(0)) throw new AccessError(403, "O custo não pode ser negativo");
    averageCost = nextQuantity.eq(0)
      ? unitCost
      : previousQuantity.mul(previousCost).add(quantity.mul(unitCost)).div(nextQuantity);
  }

  await tx.stockBalance.upsert({
    where: { productId: product.id },
    create: { organizationId: input.organizationId, storeId: input.storeId, productId: product.id, quantity: nextQuantity, averageCost },
    update: { quantity: nextQuantity, averageCost },
  });
  return tx.stockMovement.create({ data: {
    organizationId: input.organizationId,
    storeId: input.storeId,
    productId: product.id,
    type: input.type,
    quantity: delta,
    unitCost,
    balanceAfter: nextQuantity,
    reason: input.reason,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    lotNumber: input.lotNumber,
    expiresAt: input.expiresAt,
    actorId: input.actorId,
  } });
}

export async function recordStockMovement(input: MovementInput) {
  return db.$transaction((tx) => applyStockMovement(tx, input), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}
