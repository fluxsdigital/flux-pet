import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";

const schema = z.object({ storeId: z.string().min(1), openingAmount: z.coerce.number().min(0).max(999999999999.99) });

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId || !access.storeIds.includes(storeId)) throw new AccessError(404, "Loja não encontrada");
    return Response.json({ data: await db.cashSession.findMany({
      where: {
        organizationId: access.organizationId,
        storeId,
        ...(access.role === "CASHIER" ? { userId: access.session.user.id } : {}),
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    }) });
  } catch (error) { return accessErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER", "CASHIER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 422 });
    if (!access.storeIds.includes(parsed.data.storeId)) throw new AccessError(404, "Loja não encontrada");
    const existing = await db.cashSession.findFirst({ where: { organizationId: access.organizationId, storeId: parsed.data.storeId, userId: access.session.user.id, status: "OPEN" } });
    if (existing) return Response.json(existing);
    const cash = await db.cashSession.create({ data: { organizationId: access.organizationId, storeId: parsed.data.storeId, userId: access.session.user.id, openingAmount: parsed.data.openingAmount } });
    return Response.json(cash, { status: 201 });
  } catch (error) { return accessErrorResponse(error); }
}
