import type { NextRequest } from "next/server";

import { accessErrorResponse, getAccessContext } from "@/lib/access";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const access = await getAccessContext(request);
    const organization = await db.organization.findUniqueOrThrow({
      where: { id: access.organizationId },
      select: { id: true, name: true, timezone: true, stores: { where: { id: { in: access.storeIds } } } },
    });
    return Response.json({ user: access.session.user, role: access.role, organization });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
