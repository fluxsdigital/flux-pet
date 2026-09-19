import type { MembershipRole, MembershipStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { accessErrorResponse, AccessError, getAccessContext, requireRole } from "@/lib/access";
import { db } from "@/lib/db";

const schema = z
  .object({
    role: z.enum(["OWNER", "MANAGER", "CASHIER", "STOCK"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((value) => value.role || value.status, "Informe uma alteração");

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext(request);
    requireRole(access.role, ["OWNER"]);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 422 });

    const { id } = await context.params;
    const target = await db.membership.findFirst({ where: { id, organizationId: access.organizationId } });
    if (!target) throw new AccessError(404, "Usuário não encontrado");

    const removesOwner =
      target.role === "OWNER" &&
      target.status === "ACTIVE" &&
      (parsed.data.role && parsed.data.role !== "OWNER" || parsed.data.status === "INACTIVE");
    if (removesOwner) {
      const owners = await db.membership.count({
        where: { organizationId: access.organizationId, role: "OWNER", status: "ACTIVE" },
      });
      if (owners <= 1) return Response.json({ error: "A organização precisa manter um OWNER ativo" }, { status: 409 });
    }

    const membership = await db.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id: target.id },
        data: {
          role: parsed.data.role as MembershipRole | undefined,
          status: parsed.data.status as MembershipStatus | undefined,
        },
        select: { id: true, role: true, status: true },
      });
      await tx.auditEvent.create({
        data: {
          organizationId: access.organizationId,
          actorId: access.session.user.id,
          action: "membership.updated",
          entityType: "Membership",
          entityId: target.id,
          metadata: { previousRole: target.role, previousStatus: target.status, ...parsed.data },
        },
      });
      return updated;
    });
    return Response.json(membership);
  } catch (error) {
    return accessErrorResponse(error);
  }
}
