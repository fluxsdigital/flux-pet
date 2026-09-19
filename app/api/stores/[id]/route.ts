import type { NextRequest } from "next/server";

import { accessErrorResponse, AccessError, getAccessContext } from "@/lib/access";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext(request);
    const { id } = await context.params;
    const store = await db.store.findFirst({
      where: { id, organizationId: access.organizationId, AND: { id: { in: access.storeIds } } },
      select: { id: true, name: true, slug: true, status: true, timezone: true },
    });
    if (!store) throw new AccessError(404, "Loja não encontrada");
    return Response.json(store);
  } catch (error) {
    return accessErrorResponse(error);
  }
}
