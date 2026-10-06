import "dotenv/config";
import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { POST as onboard } from "../../app/api/onboarding/route";
import { GET as getCatalogItem, PATCH as updateCatalogItem } from "../../app/api/catalog/[resource]/[id]/route";
import { GET as listCatalog, POST as createCatalog } from "../../app/api/catalog/[resource]/route";
import { POST as createInventory } from "../../app/api/stock/inventories/route";
import { GET as getStock, POST as moveStock } from "../../app/api/stock/route";
import { POST as openCash } from "../../app/api/pos/cash-sessions/route";
import { POST as closeCash } from "../../app/api/pos/cash-sessions/[id]/close/route";
import { POST as cancelSale } from "../../app/api/pos/sales/[id]/cancel/route";
import { POST as returnSale } from "../../app/api/pos/sales/[id]/returns/route";
import { POST as createSale } from "../../app/api/pos/sales/route";
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
    await db.saleReturnItem.deleteMany({ where: { saleReturn: { sale: { organizationId: { in: createdOrganizationIds } } } } });
    await db.saleReturn.deleteMany({ where: { sale: { organizationId: { in: createdOrganizationIds } } } });
    await db.saleCancellation.deleteMany({ where: { sale: { organizationId: { in: createdOrganizationIds } } } });
    await db.accountReceivable.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.salePayment.deleteMany({ where: { sale: { organizationId: { in: createdOrganizationIds } } } });
    await db.saleItem.deleteMany({ where: { sale: { organizationId: { in: createdOrganizationIds } } } });
    await db.sale.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.cashSession.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.inventoryItem.deleteMany({ where: { inventoryCount: { organizationId: { in: createdOrganizationIds } } } });
    await db.inventoryCount.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.stockMovement.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.stockBalance.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.product.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.service.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.category.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.supplier.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
    await db.customer.deleteMany({ where: { organizationId: { in: createdOrganizationIds } } });
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
    expect(await response.json()).toEqual({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Este e-mail já está cadastrado. Entre com sua conta ou use outro e-mail.",
      },
    });
    expect(await db.organization.count({ where: { id: { in: createdOrganizationIds } } })).toBe(organizationsBefore);
    expect(await db.user.count({ where: { id: { in: createdUserIds } } })).toBe(usersBefore);
    expect(await db.organization.count({ where: { name: "Should Roll Back" } })).toBe(0);
  });

  it("returns actionable validation errors and rejects invalid credentials", async () => {
    const invalid = await onboard(new Request("http://localhost/api/onboarding", {
      method: "POST",
      body: JSON.stringify({ ownerName: "A", email: "invalid", password: "short", organizationName: "", storeName: "" }),
    }));
    expect(invalid.status).toBe(422);
    const validation = await invalid.json() as { error: { code: string; fields: Record<string, string[]> } };
    expect(validation.error.code).toBe("VALIDATION_ERROR");
    expect(validation.error.fields.email).toContain("Informe um e-mail válido.");
    expect(validation.error.fields.password).toContain("A senha deve ter pelo menos 10 caracteres.");

    const rejected = await auth.api.signInEmail({ body: { email: emailA, password: "wrong-password" }, asResponse: true });
    expect(rejected.status).toBe(401);
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

  it("creates, lists, filters and inactivates every catalog resource without cross-tenant leakage", async () => {
    const tenantA = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop A" }, include: { stores: true } });
    const tenantB = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop B" }, include: { stores: true } });
    const cookieA = await login(emailA);
    const cookieB = await login(emailB);
    const storeA = tenantA.stores[0]!.id;
    const storeB = tenantB.stores[0]!.id;

    async function create(resource: string, cookie: string, body: object) {
      return createCatalog(new NextRequest(`http://localhost/api/catalog/${resource}`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify(body),
      }), { params: Promise.resolve({ resource }) });
    }

    const categoryResponse = await create("categories", cookieA, { storeId: storeA, name: "Alimentos", slug: "alimentos" });
    expect(categoryResponse.status).toBe(201);
    const category = (await categoryResponse.json()) as { id: string };
    const productResponse = await create("products", cookieA, {
      storeId: storeA, categoryId: category.id, name: "Ração Premium", sku: `RACAO-${suffix}`,
      barcode: `789${suffix}`, unit: "KILOGRAM", salePrice: 59.9, referenceCost: 31.45,
    });
    const supplierResponse = await create("suppliers", cookieA, { storeId: storeA, name: "Fornecedor Sul", email: "sul@example.test" });
    const customerResponse = await create("customers", cookieA, { storeId: storeA, name: "Cliente Flux", petName: "Nina" });
    const serviceResponse = await create("services", cookieA, {
      storeId: storeA, categoryId: category.id, name: "Banho", code: `BANHO-${suffix}`,
      salePrice: 80, estimatedCost: 24, durationMinutes: 60,
    });
    for (const response of [productResponse, supplierResponse, customerResponse, serviceResponse]) expect(response.status).toBe(201);
    const product = (await productResponse.json()) as { id: string };

    const list = await listCatalog(new NextRequest("http://localhost/api/catalog/products?q=Premium&page=1&pageSize=5", { headers: { cookie: cookieA } }), {
      params: Promise.resolve({ resource: "products" }),
    });
    expect(list.status).toBe(200);
    expect(((await list.json()) as { pagination: { total: number } }).pagination.total).toBe(1);

    const foreignRead = await getCatalogItem(new NextRequest("http://localhost/api/catalog/products/foreign", { headers: { cookie: cookieB } }), {
      params: Promise.resolve({ resource: "products", id: product.id }),
    });
    expect(foreignRead.status).toBe(404);
    const foreignCreate = await create("products", cookieB, {
      storeId: storeB, categoryId: category.id, name: "Cross tenant", sku: `CROSS-${suffix}`,
      salePrice: 1, referenceCost: 1,
    });
    expect(foreignCreate.status).toBe(404);

    const inactive = await updateCatalogItem(new NextRequest(`http://localhost/api/catalog/products/${product.id}`, {
      method: "PATCH",
      headers: { cookie: cookieA, "content-type": "application/json" },
      body: JSON.stringify({ status: "INACTIVE" }),
    }), { params: Promise.resolve({ resource: "products", id: product.id }) });
    expect(inactive.status).toBe(200);
    expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).status).toBe("INACTIVE");
  });

  it("keeps an immutable stock ledger, moving average cost and inventory adjustment", async () => {
    const tenantA = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop A" }, include: { stores: true } });
    const tenantB = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop B" } });
    const product = await db.product.findFirstOrThrow({ where: { organizationId: tenantA.id } });
    await db.product.update({ where: { id: product.id }, data: { status: "ACTIVE" } });
    const cookieA = await login(emailA);
    const cookieB = await login(emailB);

    async function movement(type: "RECEIPT" | "ADJUSTMENT_OUT", quantity: number, unitCost?: number) {
      return moveStock(new NextRequest("http://localhost/api/stock", {
        method: "POST",
        headers: { cookie: cookieA, "content-type": "application/json" },
        body: JSON.stringify({ storeId: product.storeId, productId: product.id, type, quantity, unitCost, reason: "Teste auditável" }),
      }));
    }
    expect((await movement("RECEIPT", 10, 20)).status).toBe(201);
    expect((await movement("RECEIPT", 10, 30)).status).toBe(201);
    expect((await movement("RECEIPT", 3, 10)).status).toBe(201);
    expect((await movement("ADJUSTMENT_OUT", 4)).status).toBe(201);
    let balance = await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } });
    expect(balance.quantity.toString()).toBe("19");
    expect(balance.averageCost.toString()).toBe("23.0435");

    const inventory = await createInventory(new NextRequest("http://localhost/api/stock/inventories", {
      method: "POST",
      headers: { cookie: cookieA, "content-type": "application/json" },
      body: JSON.stringify({ storeId: product.storeId, notes: "Contagem física", items: [{ productId: product.id, countedQuantity: 12 }] }),
    }));
    expect(inventory.status).toBe(201);
    balance = await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } });
    expect(balance.quantity.toString()).toBe("12");
    expect(await db.stockMovement.count({ where: { productId: product.id } })).toBe(5);

    const crossTenant = await getStock(new NextRequest(`http://localhost/api/stock?storeId=${product.storeId}`, { headers: { cookie: cookieB } }));
    expect(crossTenant.status).toBe(404);
    expect(tenantB.id).not.toBe(tenantA.id);
  });

  it("confirms an idempotent credit sale and cancels it with compensating stock", async () => {
    const tenant = await db.organization.findFirstOrThrow({ where: { name: "Pet Shop A" }, include: { stores: true } });
    const storeId = tenant.stores[0]!.id;
    const product = await db.product.findFirstOrThrow({ where: { organizationId: tenant.id } });
    const customer = await db.customer.findFirstOrThrow({ where: { organizationId: tenant.id } });
    const cookie = await login(emailA);
    const cashResponse = await openCash(new NextRequest("http://localhost/api/pos/cash-sessions", {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ storeId, openingAmount: 100 }),
    }));
    expect([200, 201]).toContain(cashResponse.status);
    const cash = (await cashResponse.json()) as { id: string };
    const body = {
      storeId, cashSessionId: cash.id, customerId: customer.id, idempotencyKey: `sale-${suffix}`,
      items: [{ productId: product.id, quantity: 2, discount: 0 }],
      payments: [{ method: "CREDIT", amount: 119.8, dueDate: "2026-10-10T12:00:00.000Z" }],
    };
    const request = () => new NextRequest("http://localhost/api/pos/sales", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(body) });
    const first = await createSale(request());
    expect(first.status).toBe(201);
    const sale = (await first.json()) as { id: string; netTotal: string };
    expect(sale.netTotal).toBe("119.8");
    const replay = await createSale(request());
    expect(replay.status).toBe(200);
    expect(replay.headers.get("Idempotency-Replayed")).toBe("true");
    expect(await db.sale.count({ where: { idempotencyKey: body.idempotencyKey } })).toBe(1);
    expect((await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } })).quantity.toString()).toBe("10");
    expect(await db.accountReceivable.count({ where: { saleId: sale.id, status: "OPEN" } })).toBe(1);

    const canceled = await cancelSale(new NextRequest(`http://localhost/api/pos/sales/${sale.id}/cancel`, {
      method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ reason: "Cliente desistiu da compra" }),
    }), { params: Promise.resolve({ id: sale.id }) });
    expect(canceled.status).toBe(200);
    expect((await db.sale.findUniqueOrThrow({ where: { id: sale.id } })).status).toBe("CANCELED");
    expect((await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } })).quantity.toString()).toBe("12");
    expect(await db.stockMovement.count({ where: { referenceId: sale.id } })).toBe(2);
    expect(await db.accountReceivable.count({ where: { saleId: sale.id, status: "CANCELED" } })).toBe(1);

    const returnBody = { ...body, customerId: undefined, idempotencyKey: `return-${suffix}`, payments: [{ method: "PIX", amount: 119.8 }] };
    const returnSaleResponse = await createSale(new NextRequest("http://localhost/api/pos/sales", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify(returnBody) }));
    expect(returnSaleResponse.status).toBe(201);
    const returnable = (await returnSaleResponse.json()) as { id: string; items: Array<{ id: string }> };
    const returned = await returnSale(new NextRequest(`http://localhost/api/pos/sales/${returnable.id}/returns`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ reason: "Devolução parcial solicitada", items: [{ saleItemId: returnable.items[0]!.id, quantity: 1 }] }),
    }), { params: Promise.resolve({ id: returnable.id }) });
    expect(returned.status).toBe(201);
    expect((await db.sale.findUniqueOrThrow({ where: { id: returnable.id } })).status).toBe("PARTIALLY_RETURNED");
    expect((await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } })).quantity.toString()).toBe("11");

    const cancelAfterReturn = await cancelSale(new NextRequest(`http://localhost/api/pos/sales/${returnable.id}/cancel`, {
      method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ reason: "Tentativa após devolução parcial" }),
    }), { params: Promise.resolve({ id: returnable.id }) });
    expect(cancelAfterReturn.status).toBe(403);
    expect((await db.stockBalance.findUniqueOrThrow({ where: { productId: product.id } })).quantity.toString()).toBe("11");

    const invalidSale = await createSale(new NextRequest("http://localhost/api/pos/sales", {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, idempotencyKey: `invalid-${suffix}`, payments: [{ method: "PIX", amount: 1 }] }),
    }));
    expect(invalidSale.status).toBe(403);
    expect(await db.sale.count({ where: { idempotencyKey: `invalid-${suffix}` } })).toBe(0);

    const closed = await closeCash(new NextRequest(`http://localhost/api/pos/cash-sessions/${cash.id}/close`, {
      method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ closingAmount: 250 }),
    }), { params: Promise.resolve({ id: cash.id }) });
    expect(closed.status).toBe(200);
    expect((await db.cashSession.findUniqueOrThrow({ where: { id: cash.id } })).status).toBe("CLOSED");

    const saleAfterClose = await createSale(new NextRequest("http://localhost/api/pos/sales", {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ ...body, idempotencyKey: `closed-${suffix}` }),
    }));
    expect(saleAfterClose.status).toBe(404);
  });
});
