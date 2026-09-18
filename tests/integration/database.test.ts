import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../lib/db";

describe("PostgreSQL foundation", () => {
  afterAll(async () => db.$disconnect());

  it("connects to the migrated database", async () => {
    const result = await db.$queryRaw<Array<{ value: number }>>`SELECT 1 AS value`;
    expect(result).toEqual([{ value: 1 }]);
  });

  it("persists organization/store isolation keys", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const organization = await db.organization.create({
      data: {
        name: `Foundation ${suffix}`,
        slug: `foundation-${suffix}`,
        stores: { create: { name: "Loja principal", slug: "principal" } },
      },
      include: { stores: true },
    });

    expect(organization.stores[0]?.organizationId).toBe(organization.id);
    await db.$transaction([
      db.store.deleteMany({ where: { organizationId: organization.id } }),
      db.organization.delete({ where: { id: organization.id } }),
    ]);
  });
});
