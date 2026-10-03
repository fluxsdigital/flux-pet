"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type CatalogItem = { id: string; name: string; salePrice: string; sku?: string; code?: string };
type Cash = { id: string; status: string };
type Sale = { id: string; netTotal: string; status: string; confirmedAt: string; items: Array<{ description: string }> };

export function PosManager({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [cash, setCash] = useState<Cash | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    const [productResponse, serviceResponse, cashResponse, salesResponse] = await Promise.all([
      fetch(`/api/catalog/products?storeId=${storeId}&status=ACTIVE&pageSize=100`),
      fetch(`/api/catalog/services?storeId=${storeId}&status=ACTIVE&pageSize=100`),
      fetch(`/api/pos/cash-sessions?storeId=${storeId}`),
      fetch(`/api/pos/sales?storeId=${storeId}`),
    ]);
    if (productResponse.ok) setProducts(((await productResponse.json()) as { data: CatalogItem[] }).data);
    if (serviceResponse.ok) setServices(((await serviceResponse.json()) as { data: CatalogItem[] }).data);
    if (cashResponse.ok) setCash(((await cashResponse.json()) as { data: Cash[] }).data.find((entry) => entry.status === "OPEN") ?? null);
    if (salesResponse.ok) setSales(((await salesResponse.json()) as { data: Sale[] }).data);
  }, [storeId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  async function openCash(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/pos/cash-sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeId, openingAmount: form.get("openingAmount") }) });
    setMessage(response.ok ? "Caixa aberto." : "Não foi possível abrir o caixa.");
    await reload();
  }

  async function sell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cash) return;
    const form = new FormData(event.currentTarget);
    const [kind, id] = String(form.get("item")).split(":");
    const quantity = Number(form.get("quantity"));
    const discount = Number(form.get("discount") || 0);
    const item = [...products, ...services].find((entry) => entry.id === id);
    if (!item) return;
    const total = Math.round((Number(item.salePrice) * quantity - discount) * 100) / 100;
    const response = await fetch("/api/pos/sales", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      storeId, cashSessionId: cash.id, idempotencyKey: crypto.randomUUID(),
      items: [{ ...(kind === "product" ? { productId: id } : { serviceId: id }), quantity, discount }],
      payments: [{ method: form.get("payment"), amount: total }],
    }) });
    setMessage(response.ok ? "Venda confirmada." : ((await response.json()) as { error?: string }).error ?? "Falha na venda.");
    if (response.ok) { event.currentTarget.reset(); await reload(); }
  }

  async function cancel(id: string) {
    const reason = window.prompt("Motivo do cancelamento:");
    if (!reason) return;
    const response = await fetch(`/api/pos/sales/${id}/cancel`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
    setMessage(response.ok ? "Venda cancelada e estoque restaurado." : "Não foi possível cancelar.");
    await reload();
  }

  return <div className="space-y-space-lg">
    {!cash ? <form className="rounded-3xl bg-white p-space-lg shadow-sm" onSubmit={openCash}><h2 className="text-title-lg font-extrabold">Abrir caixa</h2><label className="mt-3 block text-sm font-bold">Troco inicial<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" min="0" name="openingAmount" required step="0.01" type="number" /></label><button className="mt-3 rounded-xl bg-primary px-5 py-3 font-bold text-white" type="submit">Abrir caixa</button></form> : <form className="grid gap-3 rounded-3xl bg-white p-space-lg shadow-sm md:grid-cols-2" onSubmit={sell}><div className="md:col-span-2"><span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">Caixa aberto</span></div><label className="text-sm font-bold">Produto ou serviço<select className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="item" required><option value="">Selecione</option>{products.map((item) => <option key={item.id} value={`product:${item.id}`}>{item.name} · R$ {item.salePrice}</option>)}{services.map((item) => <option key={item.id} value={`service:${item.id}`}>{item.name} · R$ {item.salePrice}</option>)}</select></label><label className="text-sm font-bold">Quantidade<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" defaultValue="1" min="0.001" name="quantity" required step="0.001" type="number" /></label><label className="text-sm font-bold">Desconto<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" defaultValue="0" min="0" name="discount" step="0.01" type="number" /></label><label className="text-sm font-bold">Pagamento<select className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="payment"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option></select></label><button className="rounded-xl bg-primary px-5 py-3 font-bold text-white md:col-span-2" type="submit">Confirmar venda</button></form>}
    {message && <p className="font-semibold text-primary" role="status">{message}</p>}
    <section className="rounded-3xl bg-white p-space-lg shadow-sm"><h2 className="text-title-lg font-extrabold">Vendas recentes</h2>{sales.length === 0 ? <p className="mt-3 text-on-surface-variant">Nenhuma venda registrada.</p> : <ul className="mt-3 divide-y divide-outline-variant">{sales.map((sale) => <li className="flex items-center justify-between gap-3 py-3" key={sale.id}><div><strong>{sale.items.map((item) => item.description).join(", ")}</strong><p className="text-xs text-on-surface-variant">R$ {sale.netTotal} · {sale.status}</p></div>{sale.status === "CONFIRMED" && <button className="text-sm font-bold text-red-700" onClick={() => void cancel(sale.id)} type="button">Cancelar</button>}</li>)}</ul>}</section>
  </div>;
}
