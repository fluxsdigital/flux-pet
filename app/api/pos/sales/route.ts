import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";
import { applyStockMovement } from "@/lib/stock";

const schema = z.object({
  storeId: z.string().min(1),
  cashSessionId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  idempotencyKey: z.string().min(8).max(120),
  notes: z.string().trim().max(500).optional(),
  orderDiscount: z.coerce.number().min(0).default(0),
  items: z.array(z.object({
    productId: z.string().optional(), serviceId: z.string().optional(), quantity: z.coerce.number().positive(), discount: z.coerce.number().min(0).default(0),
  }).refine((item) => Boolean(item.productId) !== Boolean(item.serviceId), "Informe produto ou serviço")).min(1),
  payments: z.array(z.object({ method: z.enum(["CASH", "PIX", "CARD", "CREDIT"]), amount: z.coerce.number().positive(), dueDate: z.coerce.date().optional() })).min(1),
});

const money = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId || !access.storeIds.includes(storeId)) throw new AccessError(404, "Loja não encontrada");
    return Response.json({ data: await db.sale.findMany({
      where: { organizationId: access.organizationId, storeId },
      include: { items: true, payments: true, customer: { select: { name: true } } },
      orderBy: { confirmedAt: "desc" }, take: 100,
    }) });
  } catch (error) { return accessErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "CASHIER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    const input = parsed.data;
    if (!access.storeIds.includes(input.storeId)) throw new AccessError(404, "Loja não encontrada");
    const hasDiscount = input.orderDiscount > 0 || input.items.some((item) => item.discount > 0);
    if (hasDiscount && !["OWNER", "MANAGER"].includes(access.role)) return Response.json({ error: "Desconto exige autorização gerencial" }, { status: 403 });

    const result = await db.$transaction(async (tx) => {
      const duplicate = await tx.sale.findUnique({ where: { organizationId_storeId_idempotencyKey: { organizationId: access.organizationId, storeId: input.storeId, idempotencyKey: input.idempotencyKey } }, include: { items: true, payments: true } });
      if (duplicate) return { sale: duplicate, replay: true };
      const cash = await tx.cashSession.findFirst({ where: { id: input.cashSessionId, organizationId: access.organizationId, storeId: input.storeId, status: "OPEN" } });
      if (!cash) throw new AccessError(404, "Caixa aberto não encontrado");
      if (access.role === "CASHIER" && cash.userId !== access.session.user.id) throw new AccessError(404, "Caixa aberto não encontrado");
      if (input.customerId) {
        const customer = await tx.customer.count({ where: { id: input.customerId, organizationId: access.organizationId, storeId: input.storeId, status: "ACTIVE" } });
        if (!customer) throw new AccessError(404, "Cliente não encontrado");
      }

      const calculated = [] as Array<{ productId?: string; serviceId?: string; description: string; quantity: Prisma.Decimal; unitPrice: Prisma.Decimal; unitCostSnapshot: Prisma.Decimal; grossTotal: Prisma.Decimal; discountTotal: Prisma.Decimal; netTotal: Prisma.Decimal }>;
      for (const item of input.items) {
        const quantity = new Prisma.Decimal(item.quantity);
        if (item.productId) {
          const product = await tx.product.findFirst({ where: { id: item.productId, organizationId: access.organizationId, storeId: input.storeId, status: "ACTIVE" } });
          if (!product) throw new AccessError(404, "Produto não encontrado");
          const balance = await tx.stockBalance.findUnique({ where: { productId: product.id } });
          const gross = money(quantity.mul(product.salePrice));
          const discount = money(item.discount);
          if (discount.gt(gross)) throw new AccessError(403, "Desconto maior que o item");
          calculated.push({ productId: product.id, description: product.name, quantity, unitPrice: product.salePrice, unitCostSnapshot: balance?.averageCost ?? product.referenceCost, grossTotal: gross, discountTotal: discount, netTotal: gross.sub(discount) });
        } else {
          const service = await tx.service.findFirst({ where: { id: item.serviceId, organizationId: access.organizationId, storeId: input.storeId, status: "ACTIVE" } });
          if (!service) throw new AccessError(404, "Serviço não encontrado");
          const gross = money(quantity.mul(service.salePrice));
          const discount = money(item.discount);
          if (discount.gt(gross)) throw new AccessError(403, "Desconto maior que o item");
          calculated.push({ serviceId: service.id, description: service.name, quantity, unitPrice: service.salePrice, unitCostSnapshot: service.estimatedCost, grossTotal: gross, discountTotal: discount, netTotal: gross.sub(discount) });
        }
      }
      const grossTotal = money(calculated.reduce((sum, item) => sum.add(item.grossTotal), new Prisma.Decimal(0)));
      const orderDiscount = money(input.orderDiscount);
      const itemDiscount = money(calculated.reduce((sum, item) => sum.add(item.discountTotal), new Prisma.Decimal(0)));
      const discountTotal = itemDiscount.add(orderDiscount);
      if (discountTotal.gt(grossTotal)) throw new AccessError(403, "Desconto maior que a venda");
      if (orderDiscount.gt(0)) { calculated[0]!.discountTotal = calculated[0]!.discountTotal.add(orderDiscount); calculated[0]!.netTotal = calculated[0]!.netTotal.sub(orderDiscount); }
      const netTotal = grossTotal.sub(discountTotal);
      const paymentTotal = money(input.payments.reduce((sum, payment) => sum.add(payment.amount), new Prisma.Decimal(0)));
      if (!paymentTotal.eq(netTotal)) throw new AccessError(403, "Pagamentos não fecham o total da venda");
      const creditPayments = input.payments.filter((payment) => payment.method === "CREDIT");
      if (creditPayments.length && !input.customerId) throw new AccessError(403, "Crediário exige cliente");
      if (creditPayments.some((payment) => !payment.dueDate)) throw new AccessError(403, "Crediário exige vencimento");

      const sale = await tx.sale.create({ data: {
        organizationId: access.organizationId, storeId: input.storeId, cashSessionId: cash.id,
        customerId: input.customerId, actorId: access.session.user.id, idempotencyKey: input.idempotencyKey,
        grossTotal, discountTotal, netTotal, notes: input.notes,
        items: { create: calculated }, payments: { create: input.payments.map(({ method, amount }) => ({ method, amount: money(amount) })) },
      }, include: { items: true, payments: true } });
      for (const item of calculated) if (item.productId) await applyStockMovement(tx, {
        organizationId: access.organizationId, storeId: input.storeId, productId: item.productId, type: "SALE",
        quantity: item.quantity, actorId: access.session.user.id, referenceType: "Sale", referenceId: sale.id,
      });
      for (const payment of creditPayments) await tx.accountReceivable.create({ data: {
        organizationId: access.organizationId, storeId: input.storeId, saleId: sale.id, customerId: input.customerId!, amount: money(payment.amount), dueDate: payment.dueDate!,
      } });
      await tx.auditEvent.create({ data: { organizationId: access.organizationId, storeId: input.storeId, actorId: access.session.user.id, action: "sale.confirmed", entityType: "Sale", entityId: sale.id, metadata: { netTotal: netTotal.toString() } } });
      return { sale, replay: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json(result.sale, { status: result.replay ? 200 : 201, headers: { "Idempotency-Replayed": String(result.replay) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return Response.json({ error: "Conflito de venda; tente novamente com a mesma chave" }, { status: 409 });
    return accessErrorResponse(error);
  }
}
