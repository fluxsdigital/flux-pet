# FP-002 — Especificação funcional do MVP

## Objetivo

Permitir que o proprietário de um pet shop registre a operação diária com
estoque e PDV e consiga responder, com números reconciliáveis:

1. Quanto vendi e recebi no período?
2. Quanto custaram os itens vendidos?
3. Qual margem sobrou para pagar a estrutura?
4. Quanto gastei para operar?
5. Houve lucro operacional?
6. Quanto preciso vender para atingir o ponto de equilíbrio?
7. O que precisa de reposição ou está parado?

## Personas e permissões

- **OWNER:** proprietário da organização. Acesso total, gestão de usuários,
  todas as lojas e indicadores financeiros. O último OWNER não pode ser
  removido ou desativado.
- **MANAGER:** gerencia operação, cadastros, estoque, despesas, PDV e relatórios
  das lojas autorizadas; não transfere propriedade.
- **CASHIER:** abre/fecha caixa, registra vendas, pagamentos e clientes; só
  cancela/devolve conforme permissão explícita.
- **STOCK:** mantém produtos, fornecedores, entradas, inventários e ajustes;
  não acessa lucro, despesas ou caixa.

Uma pessoa pertence a uma organização e recebe acesso a uma ou mais lojas. O
escopo efetivo sempre vem da sessão e das associações persistidas.

## Jornadas críticas

### Onboarding

1. Criar organização, OWNER e primeira loja em uma transação.
2. Confirmar timezone `America/Sao_Paulo` e moeda BRL.
3. Criar categorias sugeridas ou iniciar vazio.
4. Cadastrar/importar produtos e saldos iniciais com data e custo.
5. Registrar primeira entrada ou venda; abrir dashboard com explicações.

### Entrada de estoque

1. Selecionar fornecedor e documento de referência opcional.
2. Informar itens, quantidades, custo unitário, lote/validade opcionais.
3. Confirmar recebimento em uma transação.
4. Gerar movimentos de entrada e recalcular custo médio móvel.
5. Registrar usuário, horário e valores anteriores/novos na auditoria.

### Venda no PDV

1. Abrir turno de caixa.
2. Adicionar produtos/serviços; validar disponibilidade.
3. Aplicar desconto autorizado e selecionar cliente opcional.
4. Registrar um ou mais pagamentos cuja soma feche o total.
5. Confirmar atomicamente venda, itens, pagamentos, baixa de estoque e
   auditoria usando uma chave de idempotência.
6. Exibir comprovante interno; documento fiscal é integração futura.

### Cancelamento ou devolução

1. Localizar venda sem revelar dados de outra organização/loja.
2. Exigir motivo e permissão.
3. Criar evento compensatório; nunca editar/apagar a venda original.
4. Repor estoque devolvido quando aplicável e registrar reembolso/crédito.
5. Recalcular agregados a partir dos lançamentos.

### Despesa

1. Registrar categoria, descrição, valor, competência e vencimento.
2. Marcar fixa/variável e recorrência opcional.
3. Baixar pagamentos parciais/totais separadamente.
4. Dashboard de competência usa a despesa da competência; caixa usa as baixas.

### Leitura do proprietário

1. Selecionar período, loja(s) e regime exibido.
2. Ver KPIs com comparação e explicação da fórmula.
3. Abrir cada KPI para os lançamentos que formam o total.
4. Agir sobre estoque crítico, margem baixa ou ponto de equilíbrio não atingido.

## Modelo financeiro e premissas

Todos os cálculos usam valores exatos em centavos/decimal. Percentuais são
calculados com precisão ampliada e arredondados apenas para apresentação.

### Componentes

- `grossRevenue`: soma dos totais antes de descontos das vendas confirmadas.
- `discounts`: descontos efetivos em itens e total.
- `returns`: valor reconhecido de cancelamentos/devoluções no período.
- `netRevenue = grossRevenue - discounts - returns`.
- `cogs` (CMV): soma de `quantidade × custoUnitarioReconhecido` gravado em cada
  item no momento da venda. Mudança futura no produto não altera venda antiga.
- `variableExpenses`: despesas classificadas como variáveis na competência.
- `contributionMargin = netRevenue - cogs - variableExpenses`.
- `contributionMarginPercent = contributionMargin / netRevenue × 100` quando
  `netRevenue > 0`; caso contrário o percentual é `null`, não zero.
- `fixedExpenses`: despesas fixas da competência.
- `operatingProfit = contributionMargin - fixedExpenses`.
- `breakEvenRevenue = fixedExpenses / (contributionMarginPercent / 100)` apenas
  quando a margem percentual é positiva; caso contrário é `null` com alerta de
  margem insuficiente.

Impostos não entram no motor até existir configuração fiscal aprovada. Quando
forem introduzidos, serão uma dedução explícita da receita e uma nova versão da
regra, nunca uma alteração silenciosa do histórico.

### Estoque e custo

Premissa do MVP: **custo médio móvel** por produto e loja.

```text
novoCustoMedio =
  (saldoAnterior × custoMedioAnterior + quantidadeEntrada × custoEntrada)
  / (saldoAnterior + quantidadeEntrada)
```

Saídas não recalculam custo médio; registram o custo vigente como snapshot. Se
o denominador for zero, o custo da entrada vira o custo médio. Ajustes positivos
exigem custo; ajustes negativos usam o custo médio vigente.

### Caixa e competência

- **Operação/caixa:** recebimentos e pagamentos pela data efetiva de baixa.
- **DRE gerencial/competência:** vendas pela confirmação e despesas pela data de
  competência.
- A interface sempre identifica o regime; números de regimes diferentes não
  são somados no mesmo KPI.

### Datas

- Instantes persistidos em UTC.
- Dia comercial, recorrência e filtros interpretados em
  `America/Sao_Paulo` no MVP.
- Períodos usam intervalo semiaberto `[início, fim)` para evitar dupla contagem.

## Mapa de domínio e casos de uso

| Área | Entidades principais | Casos de uso |
| --- | --- | --- |
| Acesso | Organization, Store, User, Membership, StoreAccess | onboarding, login, convite, papel/status |
| Catálogo | Product, Category, Supplier, Customer, Service | cadastrar, listar, editar, inativar |
| Estoque | StockMovement, StockBalance, InventoryCount, PurchaseReceipt | receber, ajustar, inventariar, consultar ledger |
| PDV | CashSession, Sale, SaleItem, Payment, Return | abrir/fechar, vender, cancelar, devolver |
| Financeiro | Expense, ExpenseCategory, PayablePayment | lançar, recorrer, baixar, consultar |
| Inteligência | FinancialSnapshot/queries | KPIs, ponto de equilíbrio, tendências, alertas |
| Auditoria | AuditEvent | rastrear ator, ação, entidade e metadados seguros |

## Limites do MVP

Incluído: uma organização com múltiplas lojas, usuários/papéis, catálogo,
estoque, PDV, despesas, motor financeiro, dashboard, relatórios CSV e dataset
demo removível.

Não incluído inicialmente: emissão fiscal real, integração WhatsApp, adquirente,
conciliação bancária automática, folha, contabilidade oficial, agenda clínica,
prontuário veterinário, e-commerce e cobrança da assinatura SaaS.

## Critérios transversais

- Nenhuma mutação crítica apaga histórico.
- Nenhum ID fornecido pelo cliente define organização/loja sem autorização.
- Toda venda/entrada/ajuste é transacional e idempotente onde houver retry.
- KPIs são rastreáveis até lançamentos de origem e exibem fórmula/regime.
- Erros não revelam existência de recurso de outro tenant.
- Estados vazio, carregando, erro e sucesso existem em telas operacionais.
- Fluxos críticos funcionam em 390 px e desktop, com teclado e labels.
- Landing `/` continua pública e visualmente preservada.
