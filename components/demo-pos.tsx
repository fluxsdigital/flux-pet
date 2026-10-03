"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/ui";

const products = [
  { id: "rac-104", name: "Ração Premium Adulto 10 kg", sku: "RAC-104", price: 149.9, icon: "pets" },
  { id: "med-032", name: "Antipulgas 10–20 kg", sku: "MED-032", price: 64.9, icon: "medication" },
  { id: "hig-089", name: "Shampoo Neutro 500 ml", sku: "HIG-089", price: 29.9, icon: "sanitizer" },
  { id: "pet-215", name: "Petisco Natural Frango", sku: "PET-215", price: 18.5, icon: "cookie" },
  { id: "ace-058", name: "Brinquedo Mordedor", sku: "ACE-058", price: 24.9, icon: "toys" },
  { id: "hig-142", name: "Tapete Higiênico 30 un.", sku: "HIG-142", price: 54.9, icon: "cleaning_services" },
] as const;

type Cart = Record<string, number>;
type Payment = "Pix" | "Cartão" | "Dinheiro";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DemoPos() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [payment, setPayment] = useState<Payment>("Pix");
  const [receipt, setReceipt] = useState<{ number: string; total: number; items: number; payment: Payment } | null>(null);
  const filtered = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));
  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = useMemo(() => products.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0), [cart]);

  function changeQuantity(id: string, change: number) {
    setReceipt(null);
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + change);
      const next = { ...current };
      if (quantity) next[id] = quantity;
      else delete next[id];
      return next;
    });
  }

  function finishSale() {
    if (!itemCount) return;
    const completed = { number: `D-${String(Date.now()).slice(-6)}`, total, items: itemCount, payment };
    try { localStorage.setItem("flux-pet-demo-last-sale", JSON.stringify(completed)); } catch { /* Demo works without storage. */ }
    setReceipt(completed);
    setCart({});
  }

  return <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-primary">Frente de caixa · simulação</p><h1 className="mt-1 text-3xl font-extrabold">PDV demonstrativo</h1><p className="mt-2 text-sm text-on-surface-variant">Monte uma venda fictícia em poucos cliques. Nenhuma cobrança ou baixa de estoque é realizada.</p></div><span className="w-fit rounded-full border border-primary/20 bg-brand-soft px-3 py-2 text-xs font-extrabold text-primary">NÃO É UMA VENDA REAL</span></div>

    {receipt && <section aria-live="polite" className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-950"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-600 text-white"><Icon>check</Icon></span><div><h2 className="font-extrabold">Venda demonstrativa concluída!</h2><p className="mt-1 text-sm">Recibo {receipt.number} · {receipt.items} {receipt.items === 1 ? "item" : "itens"} · {receipt.payment} · <strong>{money.format(receipt.total)}</strong></p><p className="mt-2 text-xs">Este recibo é fictício e foi salvo somente neste navegador.</p></div></div></section>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section><label className="relative block"><span className="sr-only">Buscar produtos</span><Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</Icon><input className="h-12 w-full rounded-xl border border-surface-border bg-white pl-12 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por produto ou SKU" value={query} /></label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <article className="flex min-h-44 flex-col rounded-2xl border border-surface-border bg-white p-4" key={product.id}><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-primary"><Icon>{product.icon}</Icon></span><h2 className="mt-3 text-sm font-extrabold leading-snug">{product.name}</h2><p className="mt-1 text-xs text-on-surface-variant">{product.sku}</p><div className="mt-auto flex items-end justify-between gap-2 pt-3"><strong>{money.format(product.price)}</strong><button className="rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-white hover:bg-primary-container" onClick={() => changeQuantity(product.id, 1)} type="button"><span className="sr-only">Adicionar </span>Adicionar</button></div></article>)}</div>
        {!filtered.length && <div className="mt-4 rounded-2xl border border-dashed border-surface-border p-8 text-center text-sm text-on-surface-variant">Nenhum produto fictício encontrado.</div>}
      </section>

      <aside className="h-fit rounded-2xl border border-surface-border bg-white p-5 xl:sticky xl:top-28"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Carrinho</h2><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold">{itemCount} {itemCount === 1 ? "item" : "itens"}</span></div>
        <div className="my-5 space-y-4">{cartItems.length ? cartItems.map((product) => <div className="flex items-center gap-3" key={product.id}><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="text-xs text-on-surface-variant">{money.format(product.price)} cada</p></div><div className="flex items-center rounded-xl border border-surface-border"><button aria-label={`Diminuir ${product.name}`} className="grid h-9 w-9 place-items-center" onClick={() => changeQuantity(product.id, -1)} type="button">−</button><span className="min-w-7 text-center text-sm font-bold">{cart[product.id]}</span><button aria-label={`Aumentar ${product.name}`} className="grid h-9 w-9 place-items-center" onClick={() => changeQuantity(product.id, 1)} type="button">+</button></div></div>) : <div className="rounded-xl bg-surface-container-low p-6 text-center"><Icon className="text-3xl text-on-surface-variant">shopping_cart</Icon><p className="mt-2 text-sm font-bold">Seu carrinho está vazio</p><p className="mt-1 text-xs text-on-surface-variant">Adicione um produto para começar.</p></div>}</div>
        <div className="border-t border-surface-border pt-4"><div className="flex items-center justify-between"><span className="font-bold">Total</span><strong className="text-2xl">{money.format(total)}</strong></div><fieldset className="mt-5"><legend className="mb-2 text-sm font-extrabold">Forma de pagamento</legend><div className="grid grid-cols-3 gap-2">{(["Pix", "Cartão", "Dinheiro"] as Payment[]).map((option) => <label className={`cursor-pointer rounded-xl border px-2 py-3 text-center text-xs font-bold ${payment === option ? "border-primary bg-brand-soft text-primary" : "border-surface-border"}`} key={option}><input checked={payment === option} className="sr-only" name="payment" onChange={() => setPayment(option)} type="radio" />{option}</label>)}</div></fieldset><button className="mt-5 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!itemCount} onClick={finishSale} type="button">Concluir venda demonstrativa</button><p className="mt-3 text-center text-[11px] text-on-surface-variant">Simulação local: sem API, cobrança ou alteração real.</p></div>
      </aside>
    </div>
  </main>;
}
