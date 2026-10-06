import { db } from "../../lib/db";

export async function cleanupTenantByEmail(email: string) {
  const user = await db.user.findUnique({ where: { email }, include: { memberships: true } });
  if (!user) return;
  const organizationIds = user.memberships.map((membership) => membership.organizationId);
  await db.$transaction([
    db.auditEvent.deleteMany({ where: { organizationId: { in: organizationIds } } }),
    db.storeAccess.deleteMany({ where: { userId: user.id } }),
    db.membership.deleteMany({ where: { userId: user.id } }),
    db.store.deleteMany({ where: { organizationId: { in: organizationIds } } }),
    db.organization.deleteMany({ where: { id: { in: organizationIds } } }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.account.deleteMany({ where: { userId: user.id } }),
    db.user.delete({ where: { id: user.id } }),
  ]);
}

export async function disconnectTestDatabase() {
  await db.$disconnect();
}
