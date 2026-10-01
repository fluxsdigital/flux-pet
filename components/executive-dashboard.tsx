"use client";

import { useState } from "react";

import { Icon } from "@/components/ui";
import { alerts, dashboardData, revenueSeries, stockHighlights, type DashboardPeriod } from "@/lib/dashboard-mock";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const periods: { value: DashboardPeriod; label: string }[] = [{ value: "7d", label: "7 dias" }, { value: "30d", label: "30 dias" }, { value: "90d", label: "90 dias" }];

function MetricCard({ title, value, detail, icon, featured = false }: { title: string; value: string; detail: string; icon: string; featured?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${featured ? "border-primary/20 bg-brand-soft" : "border-surface-border bg-white"}`}>
    <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-on-surface-variant">{title}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${featured ? "bg-primary text-white" : "bg-surface-container-low text-primary"}`}><Icon className="text-[19px]">{icon}</Icon></span></div>
    <p className="mt-4 text-2xl font-extrabold tracking-tight md:text-[28px]">{value}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{detail}</p>
  </article>;
}

export function ExecutiveDashboard({ name }: { name: string }) {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const [empty, setEmpty] = useState(false);
  const data = dashboardData[period];
  const growth = ((data.revenue / data.previousRevenue - 1) * 100).toFixed(1).replace(".", ",");

  return <main className="mx-auto max-w-[1500px] px-5 py-7 md:px-8 md:py-9">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><p className="text-sm font-bold text-primary">Visão executiva</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Olá, {name.split(" ")[0]}. Veja como está seu negócio.</h1><p className="mt-2 text-sm text-on-surface-variant">Dados demonstrativos · competência · atualizado agora</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="dashboard-period">Período</label><select className="h-11 rounded-xl border border-surface-border bg-white px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary" id="dashboard-period" onChange={(event) => setPeriod(event.target.value as DashboardPeriod)} value={period}>{periods.map((item) => <option key={item.value} value={item.value}>Últimos {item.label}</option>)}</select>
        <button className="h-11 rounded-xl border border-surface-border bg-white px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low" onClick={() => setEmpty((value) => !value)} type="button">{empty ? "Mostrar demo" : "Ver estado vazio"}</button>
      </div>
    </div>

    {empty ? <section className="mt-8 grid min-h-[480px] place-items-center rounded-3xl border border-dashed border-outline-variant bg-white px-6 text-center"><div className="max-w-md"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-primary"><Icon className="text-[30px]">query_stats</Icon></span><h2 className="mt-5 text-xl font-extrabold">Seu painel começa com a primeira venda</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Cadastre produtos, registre uma entrada de estoque e conclua uma venda para acompanhar seus indicadores.</p><a className="mt-6 inline-flex rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-white" href="/sistema/cadastros">Começar pelos cadastros</a></div></section> : <>
      <section aria-label="Indicadores financeiros" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Faturamento" value={brl.format(data.revenue)} detail={`↑ ${growth}% comparado ao período anterior`} icon="payments" featured />
        <MetricCard title="Custos variáveis" value={brl.format(data.variableCosts)} detail="CMV e despesas variáveis no período" icon="receipt_long" />
        <MetricCard title="Margem de contribuição" value={brl.format(data.margin)} detail={`${data.marginPercent.toLocaleString("pt-BR")}% da receita líquida`} icon="donut_large" />
        <MetricCard title="Resultado operacional" value={brl.format(data.operatingProfit)} detail="Após despesas fixas de R$ 36.240" icon="monitoring" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <article className="rounded-2xl border border-surface-border bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-extrabold">Faturamento no período</h2><p className="mt-1 text-xs text-on-surface-variant">Evolução semanal da receita líquida</p></div><span className="rounded-full bg-positive-soft px-3 py-1 text-xs font-bold text-positive-text">Acima do período anterior</span></div>
          <div className="mt-7 flex h-48 items-end gap-2" aria-label="Gráfico de faturamento crescente nas últimas doze semanas" role="img">{revenueSeries.map((height, index) => <div className="group flex h-full flex-1 items-end" key={index}><div className="w-full rounded-t-md bg-primary-fixed transition-colors group-hover:bg-primary-container" style={{ height: `${height}%` }} /></div>)}</div>
          <div className="mt-3 flex justify-between text-[10px] text-on-surface-variant"><span>Semana 1</span><span>Semana 6</span><span>Semana 12</span></div>
        </article>
        <article className="rounded-2xl border border-surface-border bg-white p-5 md:p-6"><h2 className="font-extrabold">Ponto de equilíbrio</h2><p className="mt-1 text-xs text-on-surface-variant">Quanto precisa vender para cobrir a estrutura</p><div className="mt-7"><div className="flex items-end justify-between gap-3"><p className="text-3xl font-extrabold">{brl.format(data.breakEven)}</p><p className="text-xs font-bold text-positive-text">Meta atingida</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-container"><div className="h-full w-[79%] rounded-full bg-primary-container" /></div><div className="mt-2 flex justify-between text-xs text-on-surface-variant"><span>Equilíbrio</span><span>Faturado {brl.format(data.revenue)}</span></div></div><div className="mt-8 rounded-xl bg-surface-container-low p-4"><div className="flex items-center gap-2 text-sm font-bold"><Icon className="text-[18px] text-primary">confirmation_number</Icon>Ticket médio: {brl.format(data.averageTicket)}</div><p className="mt-1 text-xs leading-5 text-on-surface-variant">621 vendas concluídas no período selecionado.</p></div></article>
      </section>

      <section aria-labelledby="stock-title" className="mt-8"><div className="flex items-end justify-between"><div><h2 className="text-xl font-extrabold" id="stock-title">Saúde do estoque</h2><p className="mt-1 text-sm text-on-surface-variant">Capital, giro e itens que pedem ação</p></div><a className="hidden text-sm font-bold text-primary sm:block" href="/sistema/estoque">Ver estoque →</a></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stockHighlights.map((item) => <MetricCard detail={item.detail} icon={item.icon} key={item.label} title={item.label} value={item.value} />)}</div></section>

      <section aria-labelledby="alerts-title" className="mt-8"><h2 className="text-xl font-extrabold" id="alerts-title">Alertas e recomendações</h2><div className="mt-4 grid gap-4 lg:grid-cols-3">{alerts.map((alert) => { const styles = alert.tone === "error" ? "bg-error-container text-on-error-container" : alert.tone === "warning" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-positive-soft text-positive-text"; return <article className="rounded-2xl border border-surface-border bg-white p-5" key={alert.title}><span className={`grid h-10 w-10 place-items-center rounded-xl ${styles}`}><Icon className="text-[20px]">{alert.icon}</Icon></span><h3 className="mt-4 text-sm font-extrabold">{alert.title}</h3><p className="mt-2 min-h-10 text-xs leading-5 text-on-surface-variant">{alert.text}</p><button className="mt-4 text-xs font-extrabold text-primary" type="button">{alert.action} →</button></article>; })}</div></section>
    </>}
  </main>;
}
