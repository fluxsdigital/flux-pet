"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = { id: string; name: string; sku: string };
type Balance = { id: string; quantity: string; averageCost: string; product: Product & { minimumStock: string } };
type Movement = { id: string; type: string; quantity: string; unitCost: string; occurredAt: string; product: Product };

export function StockManager({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [message, setMessage] = useState("");

  async function reload() {
    const [catalog, stock] = await Promise.all([
      fetch(`/api/catalog/products?storeId=${storeId}&status=ACTIVE&pageSize=100`),
      fetch(`/api/stock?storeId=${storeId}`),
    ]);
    if (catalog.ok) setProducts(((await catalog.json()) as { data: Product[] }).data);
    if (stock.ok) {
      const body = (await stock.json()) as { balances: Balance[]; movements: Movement[] };
      setBalances(body.balances);
      setMovements(body.movements);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/catalog/products?storeId=${storeId}&status=ACTIVE&pageSize=100`).then((response) => response.json()),
      fetch(`/api/stock?storeId=${storeId}`).then((response) => response.json()),
    ]).then(([catalog, stock]) => {
      if (!cancelled) {
        setProducts((catalog as { data: Product[] }).data ?? []);
        setBalances((stock as { balances: Balance[] }).balances ?? []);
        setMovements((stock as { movements: Movement[] }).movements ?? []);
      }
    });
    return () => { cancelled = true; };
  }, [storeId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/stock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      storeId,
      productId: form.get("productId"),
      type: form.get("type"),
      quantity: form.get("quantity"),
      unitCost: form.get("unitCost") || undefined,
      reason: form.get("reason") || undefined,
    }) });
    setMessage(response.ok ? "Movimento registrado." : ((await response.json()) as { error?: string }).error ?? "Falha ao movimentar.");
    if (response.ok) { event.currentTarget.reset(); await reload(); }
  }

  return <div className="space-y-space-lg">
    <form className="grid gap-3 rounded-3xl bg-white p-space-lg shadow-sm md:grid-cols-2" onSubmit={submit}>
      <label className="text-sm font-bold">Produto<select className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="productId" required><option value="">Selecione</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
      <label className="text-sm font-bold">Operação<select className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="type"><option value="RECEIPT">Entrada</option><option value="ADJUSTMENT_IN">Ajuste positivo</option><option value="ADJUSTMENT_OUT">Ajuste negativo</option></select></label>
      <label className="text-sm font-bold">Quantidade<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" min="0.001" name="quantity" required step="0.001" type="number" /></label>
      <label className="text-sm font-bold">Custo unitário<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" min="0" name="unitCost" step="0.01" type="number" /></label>
      <label className="text-sm font-bold md:col-span-2">Motivo / documento<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="reason" /></label>
      <button className="rounded-xl bg-primary px-5 py-3 font-bold text-white md:col-span-2" type="submit">Registrar movimento</button>
    </form>
    {message && <p className="font-semibold text-primary" role="status">{message}</p>}
    <section className="rounded-3xl bg-white p-space-lg shadow-sm"><h2 className="text-title-lg font-extrabold">Saldos</h2>{balances.length === 0 ? <p className="mt-3 text-on-surface-variant">Nenhum saldo registrado.</p> : <ul className="mt-3 divide-y divide-outline-variant">{balances.map((balance) => <li className="flex justify-between gap-3 py-3" key={balance.id}><div><strong>{balance.product.name}</strong><p className="text-xs text-on-surface-variant">{balance.product.sku}</p></div><div className="text-right"><strong>{balance.quantity}</strong><p className="text-xs text-on-surface-variant">Custo médio R$ {balance.averageCost}</p></div></li>)}</ul>}</section>
    <section className="rounded-3xl bg-white p-space-lg shadow-sm"><h2 className="text-title-lg font-extrabold">Histórico auditável</h2><ul className="mt-3 divide-y divide-outline-variant">{movements.slice(0, 20).map((movement) => <li className="flex justify-between gap-3 py-3 text-sm" key={movement.id}><span><strong>{movement.product.name}</strong><br/><small>{movement.type}</small></span><span className="text-right font-bold">{movement.quantity}<br/><small>{new Date(movement.occurredAt).toLocaleString("pt-BR")}</small></span></li>)}</ul></section>
  </div>;
}
