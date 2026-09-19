import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StockManager } from "@/components/stock-manager";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StockPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) redirect("/entrar");
  const membership = await db.membership.findFirst({ where: { userId: session.user.id, status: "ACTIVE" }, include: { storeAccess: { include: { store: true } } } });
  const store = membership?.storeAccess[0]?.store;
  if (!store) redirect("/sistema");
  return <main className="min-h-screen bg-surface px-margin-mobile py-space-xl text-on-surface md:px-margin"><div className="mx-auto max-w-5xl"><Link className="text-sm font-bold text-primary" href="/sistema">← Visão geral</Link><h1 className="mt-3 text-headline-lg font-extrabold">Estoque</h1><p className="mb-space-lg text-on-surface-variant">Entradas, ajustes, saldos e histórico da loja {store.name}.</p><StockManager storeId={store.id} /></div></main>;
}
