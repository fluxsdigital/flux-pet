"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Brand, Icon } from "@/components/ui";

const navigation = [
  { href: "/demonstracao", label: "Visão geral", icon: "space_dashboard" },
  { href: "/demonstracao/pdv", label: "PDV", icon: "point_of_sale" },
  { href: "/demonstracao/estoque", label: "Estoque", icon: "inventory_2" },
  { href: "/demonstracao/cadastros", label: "Cadastros", icon: "category" },
] as const;

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = <>
    <div className="flex h-20 items-center border-b border-surface-border px-5"><Brand compact /></div>
    <nav aria-label="Navegação da demonstração" className="flex-1 space-y-1 px-3 py-5">{navigation.map((item) => {
      const active = item.href === "/demonstracao" ? pathname === item.href : pathname.startsWith(item.href);
      return <Link aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${active ? "bg-brand-soft text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`} href={item.href} key={item.href} onClick={() => setOpen(false)}><Icon className="text-[20px]">{item.icon}</Icon>{item.label}</Link>;
    })}</nav>
    <div className="border-t border-surface-border p-4"><Link className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low" href="/"><Icon className="text-[19px]">arrow_back</Icon>Voltar à landing</Link></div>
  </>;

  return <div className="min-h-screen bg-surface text-on-surface">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-border bg-white lg:flex">{nav}</aside>
    {open && <button aria-label="Fechar menu" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} type="button" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,19rem)] flex-col bg-white shadow-2xl transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{nav}</aside>
    <div className="lg:pl-64">
      <div className="bg-on-primary-fixed px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wider text-primary-fixed">Ambiente de demonstração · dados fictícios · somente leitura</div>
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-surface-border bg-surface/90 px-5 backdrop-blur md:px-8">
        <div className="flex min-w-0 items-center gap-3"><button aria-label="Abrir menu" className="grid h-10 w-10 place-items-center rounded-xl border border-surface-border bg-white lg:hidden" onClick={() => setOpen(true)} type="button"><Icon>menu</Icon></button><div><p className="text-sm font-bold">Pet Shop Amigo</p><p className="flex items-center gap-1 text-xs text-on-surface-variant"><Icon className="text-[15px]">storefront</Icon>Loja Centro</p></div></div>
        <span className="rounded-full bg-brand-soft px-3 py-2 text-xs font-extrabold text-primary">DEMO</span>
      </header>
      {children}
    </div>
  </div>;
}
