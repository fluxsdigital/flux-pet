import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";

const schema = z.object({ closingAmount: z.coerce.number().min(0).max(999999999999.99) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "CASHIER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 422 });
    const cash = await db.cashSession.findFirst({ where: { id: (await context.params).id, organizationId: access.organizationId, storeId: { in: access.storeIds }, status: "OPEN" } });
    if (!cash) throw new AccessError(404, "Caixa não encontrado");
    if (cash.userId !== access.session.user.id && access.role === "CASHIER") throw new AccessError(404, "Caixa não encontrado");
    return Response.json(await db.cashSession.update({ where: { id: cash.id }, data: { status: "CLOSED", closingAmount: parsed.data.closingAmount, closedAt: new Date() } }));
  } catch (error) { return accessErrorResponse(error); }
}
