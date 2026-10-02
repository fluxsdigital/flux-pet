import Link from "next/link";

import { Icon } from "@/components/ui";

type Module = "pdv" | "estoque" | "cadastros";

const content = {
  pdv: {
    eyebrow: "Frente de caixa", title: "PDV", description: "Simulação do fluxo de venda e fechamento de caixa.", action: "Nova venda",
    stats: [["Caixa atual", "R$ 1.842,50", "point_of_sale"], ["Vendas hoje", "18", "shopping_bag"], ["Ticket médio", "R$ 102,36", "confirmation_number"]],
    columns: ["Horário", "Venda", "Pagamento", "Total"],
    rows: [["14:32", "#1048 · 3 itens", "Pix", "R$ 184,90"], ["13:58", "#1047 · 1 item", "Cartão", "R$ 89,90"], ["13:41", "#1046 · 5 itens", "Dinheiro", "R$ 247,50"], ["12:16", "#1045 · 2 itens", "Cartão", "R$ 132,00"]],
  },
  estoque: {
    eyebrow: "Operação", title: "Estoque", description: "Saldos, cobertura e necessidades de reposição.", action: "Registrar entrada",
    stats: [["Em estoque", "1.248 itens", "inventory_2"], ["Valor em custo", "R$ 42.680", "payments"], ["Estoque crítico", "8 produtos", "warning"]],
    columns: ["Produto", "SKU", "Saldo", "Situação"],
    rows: [["Ração Premium Adulto 10 kg", "RAC-104", "4 un.", "Repor"], ["Antipulgas 10–20 kg", "MED-032", "2 un.", "Crítico"], ["Shampoo Neutro 500 ml", "HIG-089", "18 un.", "Saudável"], ["Petisco Natural Frango", "PET-215", "32 un.", "Saudável"]],
  },
  cadastros: {
    eyebrow: "Base operacional", title: "Cadastros", description: "Produtos, clientes e fornecedores organizados em um só lugar.", action: "Novo cadastro",
    stats: [["Produtos", "386", "category"], ["Clientes", "1.124", "groups"], ["Fornecedores", "26", "local_shipping"]],
    columns: ["Item", "Tipo", "Identificador", "Status"],
    rows: [["Ração Premium Adulto 10 kg", "Produto", "RAC-104", "Ativo"], ["Maria Oliveira", "Cliente", "CLI-1124", "Ativo"], ["Distribuidora Pet Sul", "Fornecedor", "FOR-026", "Ativo"], ["Banho porte médio", "Serviço", "SER-014", "Ativo"]],
  },
} satisfies Record<Module, { eyebrow: string; title: string; description: string; action: string; stats: string[][]; columns: string[]; rows: string[][] }>;

export function DemoModule({ module }: { module: Module }) {
  const data = content[module];
  return <main className="mx-auto max-w-[1400px] px-5 py-7 md:px-8 md:py-9">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-primary">{data.eyebrow}</p><h1 className="mt-1 text-3xl font-extrabold">{data.title}</h1><p className="mt-2 text-sm text-on-surface-variant">{data.description}</p></div><button aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-white opacity-70" title="Ações ficam desativadas na demonstração" type="button"><Icon className="text-[18px]">add</Icon>{data.action}</button></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3">{data.stats.map(([label, value, icon]) => <article className="rounded-2xl border border-surface-border bg-white p-5" key={label}><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-primary"><Icon className="text-[19px]">{icon}</Icon></span><p className="mt-4 text-xs font-semibold text-on-surface-variant">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></article>)}</div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-white"><div className="flex items-center justify-between border-b border-surface-border p-5"><div><h2 className="font-extrabold">Visão recente</h2><p className="mt-1 text-xs text-on-surface-variant">Informações fictícias para visualização do produto</p></div><span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">Somente leitura</span></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr>{data.columns.map((column) => <th className="px-5 py-3 font-bold" key={column}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row) => <tr className="border-t border-surface-borderLight" key={row.join("-")}>{row.map((cell, index) => <td className={`px-5 py-4 ${index === 0 ? "font-bold" : "text-on-surface-variant"}`} key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></section>
    <div className="mt-6 flex items-center gap-2 rounded-2xl border border-primary/20 bg-brand-soft p-4 text-sm text-on-surface-variant"><Icon className="text-primary">lock</Icon><p>Esta tela é uma prévia não interativa. <Link className="font-bold text-primary underline" href="/criar-conta">Crie um workspace</Link> quando o ambiente operacional estiver disponível.</p></div>
  </main>;
}
