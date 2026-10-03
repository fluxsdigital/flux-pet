"use client";

import { FormEvent, useEffect, useState } from "react";

import { Icon } from "@/components/ui";

type Product = { id: string; name: string; sku: string; category: string; quantity: number; price: number };

const initialProducts: Product[] = [
  { id: "1", name: "Ração Premium Adulto 10 kg", sku: "RAC-104", category: "Alimentação", quantity: 4, price: 149.9 },
  { id: "2", name: "Antipulgas 10–20 kg", sku: "MED-032", category: "Medicamentos", quantity: 2, price: 64.9 },
  { id: "3", name: "Shampoo Neutro 500 ml", sku: "HIG-089", category: "Higiene", quantity: 18, price: 29.9 },
  { id: "4", name: "Petisco Natural Frango", sku: "PET-215", category: "Alimentação", quantity: 32, price: 18.5 },
];
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DemoStock() {
  const [products, setProducts] = useState(initialProducts);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("flux-pet-demo-products") ?? "[]") as Product[];
      if (Array.isArray(saved)) queueMicrotask(() => setProducts([...saved, ...initialProducts]));
    } catch { /* Invalid browser data is ignored. */ }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = { name: String(form.get("name") ?? "").trim(), sku: String(form.get("sku") ?? "").trim().toUpperCase(), category: String(form.get("category") ?? ""), quantity: Number(form.get("quantity")), price: Number(form.get("price")) };
    const nextErrors: Record<string, string> = {};
    if (values.name.length < 3) nextErrors.name = "Informe um nome com pelo menos 3 caracteres.";
    if (!values.sku) nextErrors.sku = "Informe o SKU.";
    else if (products.some((product) => product.sku.toLowerCase() === values.sku.toLowerCase())) nextErrors.sku = "Este SKU já aparece na demonstração.";
    if (!values.category) nextErrors.category = "Selecione uma categoria.";
    if (!Number.isInteger(values.quantity) || values.quantity < 0) nextErrors.quantity = "Informe uma quantidade inteira igual ou maior que zero.";
    if (!Number.isFinite(values.price) || values.price <= 0) nextErrors.price = "Informe um preço maior que zero.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const product = { id: `demo-${Date.now()}`, ...values };
    const saved = [product, ...products.filter((item) => item.id.startsWith("demo-"))];
    try { localStorage.setItem("flux-pet-demo-products", JSON.stringify(saved)); } catch { /* Demo works without storage. */ }
    setProducts((current) => [product, ...current]);
    setSuccess(`${product.name} foi adicionado ao estoque demonstrativo.`);
    setOpen(false);
    setErrors({});
  }

  return <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-primary">Operação · simulação</p><h1 className="mt-1 text-3xl font-extrabold">Estoque demonstrativo</h1><p className="mt-2 text-sm text-on-surface-variant">Cadastre produtos fictícios sem alterar nenhum estoque real.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white" onClick={() => { setOpen(true); setSuccess(""); }} type="button"><Icon className="text-[18px]">add</Icon>Novo produto</button></div>
    {success && <div aria-live="polite" className="mt-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-900"><Icon>check_circle</Icon>{success}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-surface-border bg-white p-5"><p className="text-xs font-semibold text-on-surface-variant">Produtos exibidos</p><p className="mt-2 text-2xl font-extrabold">{products.length}</p></article><article className="rounded-2xl border border-surface-border bg-white p-5"><p className="text-xs font-semibold text-on-surface-variant">Unidades em estoque</p><p className="mt-2 text-2xl font-extrabold">{products.reduce((sum, product) => sum + product.quantity, 0)}</p></article><article className="rounded-2xl border border-surface-border bg-white p-5"><p className="text-xs font-semibold text-on-surface-variant">Itens críticos</p><p className="mt-2 text-2xl font-extrabold">{products.filter((product) => product.quantity <= 5).length}</p></article></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-white"><div className="border-b border-surface-border p-5"><h2 className="font-extrabold">Produtos da demonstração</h2><p className="mt-1 text-xs text-on-surface-variant">Novos itens ficam salvos somente neste navegador.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3">Saldo</th><th className="px-5 py-3">Preço</th></tr></thead><tbody>{products.map((product) => <tr className="border-t border-surface-borderLight" key={product.id}><td className="px-5 py-4 font-bold">{product.name}{product.id.startsWith("demo-") && <span className="ml-2 rounded-full bg-brand-soft px-2 py-1 text-[10px] text-primary">NOVO</span>}</td><td className="px-5 py-4 text-on-surface-variant">{product.category}</td><td className="px-5 py-4 text-on-surface-variant">{product.sku}</td><td className="px-5 py-4"><span className={product.quantity <= 5 ? "font-bold text-red-700" : ""}>{product.quantity} un.</span></td><td className="px-5 py-4 text-on-surface-variant">{money.format(product.price)}</td></tr>)}</tbody></table></div></section>

    {open && <div aria-labelledby="stock-dialog-title" aria-modal="true" className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6" role="dialog"><div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wide text-primary">Cadastro fictício</p><h2 className="mt-1 text-xl font-extrabold" id="stock-dialog-title">Novo produto</h2><p className="mt-1 text-xs text-on-surface-variant">Nada será enviado ao sistema real.</p></div><button aria-label="Fechar cadastro" className="grid h-10 w-10 place-items-center rounded-xl bg-surface-container-low" onClick={() => setOpen(false)} type="button"><Icon>close</Icon></button></div><form className="mt-6 grid gap-4 sm:grid-cols-2" noValidate onSubmit={submit}><Field error={errors.name} label="Nome do produto" name="name" placeholder="Ex.: Coleira ajustável" /><Field error={errors.sku} label="SKU" name="sku" placeholder="Ex.: ACE-100" /><label className="text-sm font-bold">Categoria<select className="mt-2 h-12 w-full rounded-xl border border-surface-border bg-white px-3 font-normal" defaultValue="" name="category"><option disabled value="">Selecione</option><option>Alimentação</option><option>Acessórios</option><option>Higiene</option><option>Medicamentos</option></select>{errors.category && <span className="mt-1 block text-xs font-semibold text-red-700">{errors.category}</span>}</label><Field error={errors.quantity} label="Quantidade inicial" min="0" name="quantity" placeholder="0" step="1" type="number" /><Field error={errors.price} label="Preço de venda (R$)" min="0.01" name="price" placeholder="0,00" step="0.01" type="number" /><div className="flex items-end gap-2 sm:col-span-2 sm:justify-end"><button className="rounded-xl border border-surface-border px-5 py-3 text-sm font-bold" onClick={() => setOpen(false)} type="button">Cancelar</button><button className="rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white" type="submit">Cadastrar na demo</button></div></form></div></div>}
  </main>;
}

function Field({ error, label, ...props }: { error?: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="text-sm font-bold">{label}<input aria-invalid={Boolean(error)} className={`mt-2 h-12 w-full rounded-xl border bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-primary/10 ${error ? "border-red-500" : "border-surface-border focus:border-primary"}`} {...props} />{error && <span className="mt-1 block text-xs font-semibold text-red-700">{error}</span>}</label>;
}
