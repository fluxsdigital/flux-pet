# FP-001 — Auditoria técnica e funcional

Data: 2026-09-18  
Repositório: `fluxsdigital/flux-pet`  
Branch: `main`

## Estado atual

O repositório é uma landing page estática construída com Next.js 16 (App
Router), React 19, TypeScript 5, Tailwind CSS 3 e Playwright. A página `/` é
pré-renderizada e publicada pela Vercel. Não existem banco, API, autenticação,
estado de aplicação ou rotas internas do produto.

O código visual está separado em componentes de landing (`components/`) e os
assets do Stitch são locais. A suíte atual cobre a landing em desktop/mobile,
carregamento dos três JPEGs, FAQ, ícones e rotas antigas removidas.

## Promessas funcionais extraídas da landing

| Promessa | Capacidade necessária no produto | Estado |
| --- | --- | --- |
| Vendas e ticket médio em tempo real | PDV, pagamentos e agregações por período | Mock visual |
| Estoque, giro, mínimo e itens parados | Ledger de estoque, custo e alertas | Mock visual |
| Financeiro, CMV, margem e lucro | Despesas, custos e motor financeiro | Mock visual |
| Visão diária, semanal e mensal | Filtros de período e timezone da loja | Mock visual |
| Departamentos/categorias e margem | Categorias e alocação consistente de receita/CMV | Mock visual |
| Sugestões acionáveis | Regras explicáveis, sem IA opaca no MVP | Mock visual |
| Pix, cartão e crediário | Métodos/parcelas e conciliação mínima | Texto comercial |
| Validade e reposição | Lotes/validade e estoque mínimo | Texto comercial |
| NFC-e/NF-e e WhatsApp | Integrações fiscais/mensageria externas | Fora do MVP inicial; não implementado |

Os números e marcas exibidos na landing são demonstrativos e não constituem
dados ou regras de negócio.

## Lacunas

- Nenhum limite entre landing pública e aplicação autenticada.
- Nenhuma persistência, migration, seed ou estratégia de backup.
- Nenhum modelo de organização/loja, usuário, papel ou isolamento.
- Nenhum modelo decimal para dinheiro, custo médio ou movimentação de estoque.
- Nenhuma API, validação de entrada, tratamento de erro, log ou auditoria.
- Nenhum teste unitário/integrado de domínio.
- Nenhuma configuração de ambiente além da infraestrutura da landing.
- Nenhuma definição formal de regime de caixa versus competência.
- Nenhuma regra fechada para cancelamento, devolução ou correção retroativa.

## Arquitetura recomendada para detalhamento em FP-002/FP-003

- Manter um único projeto Next.js para landing, aplicação e API do MVP,
  separando explicitamente `(marketing)`, `(auth)` e `(app)` por route groups.
- PostgreSQL como fonte de verdade; migrations versionadas e transações para
  venda/estoque. ORM e autenticação devem usar bibliotecas mantidas, não
  implementações próprias.
- Camadas: UI → casos de uso/serviços → domínio financeiro/estoque puro →
  repositórios/banco. Fórmulas financeiras ficam puras e testáveis.
- Dinheiro armazenado em centavos inteiros ou `Decimal` do banco/ORM, nunca
  `float`; quantidades permitem escala decimal definida por unidade.
- Toda entidade operacional contém `organizationId` e `storeId` quando
  aplicável. O escopo vem da sessão, nunca de um identificador confiado do
  cliente.
- Datas persistidas em UTC; fechamento, filtros e recorrências interpretados
  em `America/Sao_Paulo` no MVP.
- Ledger imutável para estoque e trilha de auditoria append-only para eventos
  críticos. Correções geram lançamentos compensatórios.

## Riscos e decisões pendentes

1. **Fiscal e WhatsApp:** dependem de fornecedor, credenciais, custo e regras
   regulatórias. Permanecem pontos de integração, não bloqueiam o núcleo.
2. **Crediário:** precisa de política de vencimento, baixa e inadimplência. O
   MVP pode registrar contas a receber sem motor de cobrança.
3. **Custo de estoque:** custo médio móvel é a recomendação inicial; precisa ser
   confirmado na especificação antes da migration definitiva.
4. **Caixa x competência:** dashboards devem deixar o critério explícito. A
   recomendação é vendas/recebimentos por caixa e DRE gerencial por competência,
   oferecendo as duas visões sem misturá-las.
5. **Multiempresa:** o isolamento deve existir desde a primeira migration;
   retrofit posterior é risco alto de vazamento.
6. **Deploy do banco:** exige credencial/serviço PostgreSQL externo. O trabalho
   local pode avançar com Docker sem bloquear os módulos independentes.
7. **Escopo:** os quinze objetivos formam um produto amplo. Commits e entregas
   serão incrementais; a landing permanece publicável durante todo o processo.

## Evidências da auditoria

- `npm audit`: zero vulnerabilidades conhecidas.
- Node 24.15.0 e npm 11.12.1 disponíveis.
- Docker 29.1.3 e Compose 2.40.3 operacionais.
- O repositório estava sincronizado com `origin/main` no início da auditoria.
- Arquivos locais `AGENTS.md` e `CLAUDE.md` já existiam sem rastreamento e não
  pertencem a esta entrega.

