# Flux Pet — plano técnico executável

Este documento é a fonte de verdade do desenvolvimento. Estados permitidos:
`PENDING`, `IN_PROGRESS`, `BLOCKED`, `DONE`. Uma tarefa só vira `DONE` depois
de testes, revisão, commit, push e verificação do deploy aplicável.

## Sequência e critérios

### FP-001 — Auditoria técnica/funcional — `IN_PROGRESS`

Dependências: nenhuma.

- [x] Inventariar stack, rotas, componentes, assets, testes e deploy.
- [x] Mapear promessas da landing para capacidades reais.
- [x] Registrar lacunas, riscos e limites do MVP.
- [x] Criar este TODO com dependências e critérios.
- [ ] Validar documentação, commitar, fazer push e confirmar Vercel.

Aceite: `docs/AUDIT.md` e `TODO.md` versionados; landing inalterada e build
verde.

### FP-002 — Especificação do MVP — `PENDING`

Dependências: FP-001.

- [ ] Definir personas OWNER, MANAGER, CASHIER e STOCK.
- [ ] Descrever onboarding, compra/entrada, venda, cancelamento/devolução,
  despesa, fechamento e leitura do dashboard.
- [ ] Documentar glossário, fórmulas, arredondamento e exemplos verificáveis.
- [ ] Fixar caixa x competência, custo de estoque e fronteiras do MVP.
- [ ] Produzir mapa entidade → regra → tela → endpoint/caso de uso.

Aceite: especificação sem ambiguidades para schema e testes; fiscal/WhatsApp
marcados como integração futura, sem promessas técnicas falsas.

### FP-003 — Fundação técnica — `PENDING`

Dependências: FP-002.

- [ ] Criar route groups preservando `/` e adicionando shell interno.
- [ ] Configurar PostgreSQL Docker, ORM, migrations e seed de teste.
- [ ] Configurar ambiente tipado, validação, erros e logs estruturados.
- [ ] Adicionar testes unitários e de integração com banco real.
- [ ] Adicionar CI local reproduzível e `.env.example` sem segredos.

Aceite: banco sobe do zero, migrations idempotentes, health check e pipeline
lint/typecheck/unit/integration/build verdes.

### FP-004 — Autenticação e isolamento — `PENDING`

Dependências: FP-003.

- [ ] Onboarding transacional de organização, primeira loja e OWNER.
- [ ] Login, sessão, logout e recuperação segura preparada.
- [ ] Usuários/papéis OWNER, MANAGER, CASHIER e STOCK.
- [ ] Escopo por organização/loja derivado exclusivamente da sessão.
- [ ] Impedir remoção do último OWNER e testar IDOR entre duas organizações.

Aceite: recursos cross-tenant retornam não encontrado; matriz de autorização e
E2E de dois tenants verdes.

### FP-005 — Cadastros — `PENDING`

Dependências: FP-004.

- [ ] Produtos, categorias, fornecedores, clientes e serviços.
- [ ] SKU/código de barras único por loja, unidades e status ativo/inativo.
- [ ] Preço de venda, custo de referência e impostos apenas como campos
  preparatórios, sem cálculo fiscal inventado.
- [ ] Busca, filtros, paginação e importação futura documentada.

Aceite: CRUDs escopados e validados, sem exclusão destrutiva de item já usado.

### FP-006 — Estoque — `PENDING`

Dependências: FP-005.

- [ ] Ledger append-only de entrada, saída, ajuste, venda e devolução.
- [ ] Recebimento de compra, inventário e ajuste com motivo obrigatório.
- [ ] Custo médio móvel com precisão decimal e teste de arredondamento.
- [ ] Estoque mínimo, lote/validade quando informado e histórico auditável.
- [ ] Impedir saldo negativo por padrão; exceção futura explícita por política.

Aceite: saldo deriva do ledger; concorrência e compensação testadas em banco.

### FP-007 — PDV — `PENDING`

Dependências: FP-006.

- [ ] Caixa/turno, carrinho de produtos e serviços e cliente opcional.
- [ ] Desconto por item/total com permissão e trilha de auditoria.
- [ ] Dinheiro, Pix, cartão e crediário registrado como conta a receber.
- [ ] Venda transacional com baixa de estoque e idempotência.
- [ ] Cancelamento/devolução por lançamento compensatório, sem apagar venda.

Aceite: venda concorrente não duplica baixa; totais/pagamentos fecham em
centavos; cancelamento restaura saldo e preserva histórico.

### FP-008 — Despesas e custos — `PENDING`

Dependências: FP-004; pode evoluir em paralelo a FP-005–FP-007.

- [ ] Categorias, fornecedor opcional, centro/loja e anexos preparados.
- [ ] Fixas/variáveis, recorrência e competência/vencimento/pagamento.
- [ ] Contas a pagar e baixas parciais sem mistura de regimes.

Aceite: relatórios distinguem competência e caixa; recorrência não duplica
lançamentos e alterações são auditadas.

### FP-009 — Motor financeiro — `PENDING`

Dependências: FP-007 e FP-008.

- [ ] Receita bruta, descontos, devoluções e receita líquida.
- [ ] CMV, margem de contribuição em valor/% e lucro operacional.
- [ ] Custos/despesas fixos e variáveis sem dupla contagem.
- [ ] Ponto de equilíbrio com tratamento explícito de margem zero/negativa.
- [ ] Fórmulas puras, versão da regra e testes com exemplos documentados.

Aceite: cada KPI é reconciliável com lançamentos; arredondamento consistente e
testes de borda verdes.

### FP-010 — Dashboard do proprietário — `PENDING`

Dependências: FP-009.

- [ ] Período, comparação, filtro de loja e indicação do regime.
- [ ] Faturamento, ticket, margem, lucro, ponto de equilíbrio e estoque.
- [ ] Tendências e alertas explicáveis com links para os dados de origem.
- [ ] Estados vazio/carregando/erro e responsividade.

Aceite: dashboard reconciliado com fixtures do motor e utilizável em mobile.

### FP-011 — Relatórios — `PENDING`

Dependências: FP-009.

- [ ] Vendas, produtos, estoque, margens e despesas.
- [ ] Filtros/paginação consistentes e exportação CSV segura.
- [ ] Totais reconciliados com dashboard e timezone da loja.

Aceite: exports preservam centavos, datas e UTF-8; autorização testada.

### FP-012 — Qualidade e segurança — `PENDING`

Dependências: FP-004–FP-011.

- [ ] Revisão de RBAC/IDOR, validação, rate limit e cabeçalhos.
- [ ] Auditoria de eventos críticos e proteção de dados sensíveis.
- [ ] Acessibilidade, teclado, contraste e responsividade.
- [ ] Testes unitários, integração e E2E dos fluxos críticos.

Aceite: nenhuma falha alta conhecida; matriz de permissões e E2E completos.

### FP-013 — Onboarding e dados iniciais — `PENDING`

Dependências: FP-010.

- [ ] Assistente de organização/loja, categorias e estoque inicial.
- [ ] Dataset de demonstração coerente com a landing, claramente identificado.
- [ ] Checklist de ativação e caminho para limpar dados demo.

Aceite: nova conta chega a uma primeira venda e dashboard coerente sem suporte.

### FP-014 — Preparação de produção — `PENDING`

Dependências: FP-012 e FP-013.

- [ ] Migrations de produção e estratégia expand/migrate/contract.
- [ ] Backup/recuperação, retenção e exercício de restore documentados.
- [ ] Logs, métricas, alertas, runbook e política de incidentes.
- [ ] Documentação operacional, privacidade e checklist de release.

Aceite: restore ensaiado em ambiente descartável; rollback e responsáveis
documentados. Credenciais externas podem manter itens `BLOCKED` sem esconder o
impacto.

### FP-015 — Deploy e validação ponta a ponta — `PENDING`

Dependências: FP-014.

- [ ] Aplicar migrations no ambiente autorizado.
- [ ] Validar onboarding → entrada → venda → despesa → dashboard → relatório.
- [ ] Validar isolamento com duas organizações e papéis distintos.
- [ ] Confirmar landing, aplicação, observabilidade e recuperação.

Aceite: fluxo crítico completo em produção autorizado, evidências e checklist
assinados; nenhum TODO crítico aberto.

## Decisões externas rastreadas

- Provedor PostgreSQL de produção e credenciais: necessário em FP-014/FP-015.
- Provedor fiscal NFC-e/NF-e: fora do núcleo até autorização específica.
- Provedor de WhatsApp: fora do núcleo até autorização/custo específico.
- Política comercial/pagamentos SaaS: fora do escopo atual.
