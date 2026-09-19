import "dotenv/config";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { POST as onboard } from "../../app/api/onboarding/route";
import { GET as getStore } from "../../app/api/stores/[id]/route";
import { PATCH as updateUser } from "../../app/api/users/[id]/route";
import { auth } from "../../lib/auth";
import { db } from "../../lib/db";

const suffix = crypto.randomUUID().slice(0, 8);
const emailA = `owner-a-${suffix}@example.test`;
const emailB = `owner-b-${suffix}@example.test`;
const password = "local-test-password-2026";
const createdOrganizationIds: string[] = [];
const createdUserIds: string[] = [];

async function createTenant(label: string, email: string) {
  const response = await onboard(
    new Request("http://localhost/api/onboarding", {
      method: "POST",
      body: JSON.stringify({
        ownerName: `Owner ${label}`,
        email,
        password,
        organizationName: `Pet Shop ${label}`,
        storeName: `Loja ${label}`,
      }),
    }),
  );
  expect(response.status).toBe(201);
  const result = (await response.json()) as { userId: string; organizationId: string; storeId: string };
  createdOrganizationIds.push(result.organizationId);
  createdUserIds.push(result.userId);
  return result;
}

async function login(email: string) {
  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  expect(response.status).toBe(200);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();
  return setCookie!.split(";")[0]!;
}

describe("authentication and tenant isolation", () => {
  afterAll(async () => {
    await db.auditEvent.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.storeAccess.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.membership.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.store.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.organization.deleteMany({ where: { id: { in: createdOrganizationIds } } });
    await db.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.account.deleteMany({ where: { userId: { in: createdUserIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  it("creates two complete tenants transactionally and authenticates an owner", async () => {
    const tenantA = await createTenant("A", emailA);
    const tenantB = await createTenant("B", emailB);
    expect(tenantA.organizationId).not.toBe(tenantB.organizationId);

    const cookie = await login(emailA);
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe(emailA);

    const logout = await auth.api.signOut({ headers: new Headers({ cookie }), asResponse: true });
    expect(logout.status).toBe(200);
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it("does not leave partial tenant data when onboarding conflicts", async () => {
    const organizationsBefore = await db.organization.count({ where: { id: { in: createdOrganizationIds } } });
    const usersBefore = await db.user.count({ where: { id: { in: createdUserIds } } });
    const response = await onboard(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          ownerName: "Duplicate owner",
          email: emailA,
          password,
          organizationName: "Should Roll Back",
          storeName: "Should Roll Back",
        }),
      }),
    );
    expect(response.status).toBe(409);
    expect(await db.organization.count({ where: { id: { in: createdOrganizationIds } } })).toBe(organizationsBefore);
    expect(await db.user.count({ where: { id: { in: createdUserIds } } })).toBe(usersBefore);
    expect(await db.organization.count({ where: { name: "Should Roll Back" } })).toBe(0);
  });

  it("returns not found for a store that belongs to another tenant", async () => {
    const own = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop A" }, include: { stores: true } });
    const foreign = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop B" }, include: { stores: true } });
    const cookie = await login(emailA);

    const ownResponse = await getStore(new NextRequest("http://localhost/api/stores/own", { headers: { cookie } }), {
      params: Promise.resolve({ id: own.stores[0]!.id }),
    });
    const foreignResponse = await getStore(new NextRequest("http://localhost/api/stores/foreign", { headers: { cookie } }), {
      params: Promise.resolve({ id: foreign.stores[0]!.id }),
    });
    expect(ownResponse.status).toBe(200);
    expect(foreignResponse.status).toBe(404);
  });

  it("protects the last active owner", async () => {
    const membership = await db.membership.findFirstOrThrow({ where: { user: { email: emailA } } });
    const cookie = await login(emailA);
    const response = await updateUser(
      new NextRequest(`http://localhost/api/users/${membership.id}`, {
        method: "PATCH",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ role: "MANAGER" }),
      }),
      { params: Promise.resolve({ id: membership.id }) },
    );
    expect(response.status).toBe(409);
  });

  it("enforces the role matrix for user management", async () => {
    const membership = await db.membership.findFirstOrThrow({ where: { user: { email: emailA } } });
    await db.membership.update({ where: { id: membership.id }, data: { role: "CASHIER" } });
    const cookie = await login(emailA);
    const { GET: listUsers } = await import("../../app/api/users/route");
    const response = await listUsers(new NextRequest("http://localhost/api/users", { headers: { cookie } }));
    expect(response.status).toBe(403);
    await db.membership.update({ where: { id: membership.id }, data: { role: "OWNER" } });
  });
});
