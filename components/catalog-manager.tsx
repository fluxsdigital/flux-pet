"use client";

import { FormEvent, useEffect, useState } from "react";

const tabs = [
  ["products", "Produtos"],
  ["categories", "Categorias"],
  ["suppliers", "Fornecedores"],
  ["customers", "Clientes"],
  ["services", "Serviços"],
] as const;

type Resource = (typeof tabs)[number][0];
type Item = { id: string; name: string; status: "ACTIVE" | "INACTIVE"; sku?: string; code?: string };

export function CatalogManager({ storeId }: { storeId: string }) {
  const [resource, setResource] = useState<Resource>("products");
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/catalog/${resource}?storeId=${storeId}&q=${encodeURIComponent(query)}`);
    if (response.ok) setItems(((await response.json()) as { data: Item[] }).data);
    else setMessage("Não foi possível carregar os cadastros.");
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      const response = await fetch(`/api/catalog/${resource}?storeId=${storeId}&q=${encodeURIComponent(query)}`);
      if (cancelled) return;
      if (response.ok) setItems(((await response.json()) as { data: Item[] }).data);
      else setMessage("Não foi possível carregar os cadastros.");
      setLoading(false);
    }
    void fetchItems();
    return () => { cancelled = true; };
  }, [query, resource, storeId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const code = String(form.get("code") || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const body: Record<string, unknown> = { storeId, name };
    if (resource === "categories") body.slug = code;
    if (resource === "products") Object.assign(body, { sku: String(form.get("code")), salePrice: form.get("price"), referenceCost: form.get("cost") });
    if (resource === "services") Object.assign(body, { code: String(form.get("code")), salePrice: form.get("price"), estimatedCost: form.get("cost") });
    if (resource === "suppliers" || resource === "customers") Object.assign(body, { email: String(form.get("email") || "") || null, phone: String(form.get("phone") || "") || null });
    if (resource === "customers") body.petName = String(form.get("petName") || "") || null;

    const response = await fetch(`/api/catalog/${resource}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) {
      setMessage(((await response.json()) as { error?: string }).error ?? "Não foi possível salvar.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Cadastro salvo.");
    await load();
  }

  return (
    <div className="space-y-space-lg">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {tabs.map(([value, label]) => (
          <button className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${resource === value ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`} key={value} onClick={() => { setResource(value); setQuery(""); }} role="tab" type="button">{label}</button>
        ))}
      </div>
      <form className="grid gap-3 rounded-3xl bg-white p-space-lg shadow-sm md:grid-cols-2" onSubmit={submit}>
        <label className="text-sm font-bold">Nome<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="name" required /></label>
        {(resource === "products" || resource === "services") && <label className="text-sm font-bold">Código / SKU<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="code" required /></label>}
        {(resource === "products" || resource === "services") && <><label className="text-sm font-bold">Preço de venda<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" min="0" name="price" required step="0.01" type="number" /></label><label className="text-sm font-bold">Custo de referência<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" min="0" name="cost" required step="0.01" type="number" /></label></>}
        {(resource === "suppliers" || resource === "customers") && <><label className="text-sm font-bold">E-mail<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="email" type="email" /></label><label className="text-sm font-bold">Telefone<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="phone" /></label></>}
        {resource === "customers" && <label className="text-sm font-bold">Nome do pet<input className="mt-1 w-full rounded-xl border border-outline-variant p-3" name="petName" /></label>}
        <div className="flex items-end"><button className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white" type="submit">Adicionar</button></div>
      </form>
      {message && <p className="text-sm font-semibold text-primary" role="status">{message}</p>}
      <div className="rounded-3xl bg-white p-space-lg shadow-sm">
        <input aria-label="Buscar cadastros" className="mb-4 w-full rounded-xl border border-outline-variant p-3" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" value={query} />
        {loading ? <p>Carregando…</p> : items.length === 0 ? <p className="text-on-surface-variant">Nenhum cadastro encontrado.</p> : <ul className="divide-y divide-outline-variant">{items.map((item) => <li className="flex items-center justify-between gap-4 py-3" key={item.id}><div><strong>{item.name}</strong><p className="text-xs text-on-surface-variant">{item.sku ?? item.code ?? "Cadastro ativo"}</p></div><span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">{item.status === "ACTIVE" ? "Ativo" : "Inativo"}</span></li>)}</ul>}
      </div>
    </div>
  );
}
