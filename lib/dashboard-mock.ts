export type DashboardPeriod = "7d" | "30d" | "90d";

export const dashboardData = {
  "7d": { revenue: 18740, variableCosts: 7120, margin: 11620, marginPercent: 62, breakEven: 15230, operatingProfit: 3120, averageTicket: 119.36, previousRevenue: 16910 },
  "30d": { revenue: 78450, variableCosts: 30140, margin: 48310, marginPercent: 61.6, breakEven: 62240, operatingProfit: 12070, averageTicket: 126.33, previousRevenue: 69890 },
  "90d": { revenue: 224780, variableCosts: 88950, margin: 135830, marginPercent: 60.4, breakEven: 184500, operatingProfit: 31870, averageTicket: 121.44, previousRevenue: 203600 },
} satisfies Record<DashboardPeriod, Record<string, number>>;

export const revenueSeries = [42, 54, 48, 67, 63, 74, 71, 83, 79, 92, 88, 98];
export const stockHighlights = [
  { label: "Estoque em valor", value: "R$ 42.680", detail: "1.248 itens em 386 SKUs", icon: "inventory_2" },
  { label: "Giro de estoque", value: "2,8x", detail: "Cobertura estimada: 43 dias", icon: "autorenew" },
  { label: "Rupturas", value: "8", detail: "2 itens de alta prioridade", icon: "production_quantity_limits" },
  { label: "Produtos parados", value: "17", detail: "Sem venda há mais de 60 dias", icon: "hourglass_empty" },
] as const;

export const alerts = [
  { tone: "error", icon: "warning", title: "Estoque crítico em 8 produtos", text: "Rações premium e antipulgas podem romper nos próximos 5 dias.", action: "Revisar estoque" },
  { tone: "warning", icon: "trending_down", title: "Margem caiu 2,4 p.p.", text: "A categoria Higiene concentrou descontos acima da média.", action: "Ver composição" },
  { tone: "success", icon: "lightbulb", title: "Oportunidade de R$ 3.480", text: "Reponha os 4 itens com maior giro para sustentar as vendas.", action: "Ver recomendação" },
] as const;
