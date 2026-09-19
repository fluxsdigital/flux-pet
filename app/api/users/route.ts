import type { NextRequest } from "next/server";

import { accessErrorResponse, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER", "MANAGER"]);
    const memberships = await db.membership.findMany({
      where: { organizationId: access.organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        storeAccess: { select: { storeId: true } },
      },
    });
    return Response.json({ data: memberships });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
