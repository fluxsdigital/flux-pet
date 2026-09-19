import type { MembershipRole } from "@prisma/client";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export class AccessError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
  }
}

export async function getAccessContext(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new AccessError(401, "Não autenticado");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, status: "ACTIVE", organization: { status: "ACTIVE" } },
    include: { storeAccess: { select: { storeId: true } } },
  });
  if (!membership) throw new AccessError(403, "Acesso indisponível");

  return {
    session,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
    storeIds: membership.storeAccess.map((item) => item.storeId),
  };
}

export function requireRole(role: MembershipRole, accepted: MembershipRole[]) {
  if (!accepted.includes(role)) throw new AccessError(403, "Ação não permitida");
}

export function accessErrorResponse(error: unknown) {
  if (error instanceof AccessError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
