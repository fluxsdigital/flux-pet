# API local do Flux Pet

## Arquitetura

A API usa Route Handlers do Next.js sob `app/api`, no mesmo processo da
aplicação. PostgreSQL 17 é a fonte de verdade, acessada pelo Prisma. Entradas
são validadas com Zod e operações que alteram estoque ou vendas usam transações
seriais. A organização, o papel e as lojas autorizadas são sempre derivados da
sessão Better Auth; IDs enviados pelo cliente nunca definem o tenant.

Erros usam JSON no formato `{ "error": "mensagem" }`. Validação retorna `422`,
autenticação `401`, autorização `403` e recursos ausentes ou de outro tenant
`404`. Valores monetários e quantidades são persistidos como `Decimal`.

## Endpoints

### Plataforma e acesso

- `GET /api/health`: saúde do processo e do PostgreSQL.
- `POST /api/onboarding`: cria usuário OWNER, organização e primeira loja.
- `/api/auth/*`: login, sessão e logout pelo Better Auth.
- `GET /api/me`: sessão, organização, papel e lojas acessíveis.
- `GET|PATCH /api/stores/:id`: consulta e edição de loja autorizada.
- `GET|POST /api/users` e `PATCH /api/users/:id`: equipe, papéis e acessos.

### Cadastros

- `GET|POST /api/catalog/:resource`
- `GET|PATCH /api/catalog/:resource/:id`

`resource` aceita `products`, `categories`, `suppliers`, `customers` e
`services`. As listagens suportam `storeId`, busca, status e paginação conforme
o recurso. Não há exclusão destrutiva: registros operacionais são inativados.

### Estoque

- `GET /api/stock?storeId=...`: saldos e ledger escopados à loja.
- `POST /api/stock`: entrada, ajuste ou saída validada; atualiza saldo e custo
  médio e grava movimento/auditoria na mesma transação.
- `POST /api/stock/inventories`: cria ou confirma contagem física com
  lançamentos compensatórios.

O ledger é append-only e saldo negativo é rejeitado. Entradas e ajustes
positivos exigem custo; lote e validade são opcionais.

### PDV

- `GET|POST /api/pos/cash-sessions`: lista/abre turnos de caixa.
- `POST /api/pos/cash-sessions/:id/close`: fecha um turno aberto.
- `GET|POST /api/pos/sales`: lista ou confirma venda.
- `POST /api/pos/sales/:id/cancel`: cancela venda e repõe estoque com movimento
  compensatório.
- `POST /api/pos/sales/:id/returns`: registra devolução parcial e repõe os itens.

Uma venda aceita produtos e serviços, cliente opcional, descontos e múltiplos
pagamentos (`CASH`, `PIX`, `CARD`, `CREDIT`). A soma dos pagamentos deve ser
igual ao total em centavos. Crediário exige cliente e vencimento e cria conta a
receber. `idempotencyKey` é obrigatória e única por organização/loja; retries
retornam a venda existente com `Idempotency-Replayed: true`. Venda, itens,
pagamentos, baixa de estoque, recebível e auditoria são atômicos.

## Execução local

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

O PostgreSQL local fica restrito a `127.0.0.1:5434`. Para validar:

```bash
npm run db:status
npm run test:unit
npm run test:integration
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

## Preparação futura da VPS

Esta entrega não configura nem acessa a VPS. Na etapa autorizada serão
necessários Node.js 20+, PostgreSQL compatível, HTTPS/reverse proxy e as
variáveis abaixo:

- `DATABASE_URL`: conexão PostgreSQL com usuário de aplicação e TLS conforme o
  provedor.
- `BETTER_AUTH_SECRET`: segredo forte e exclusivo do ambiente.
- `BETTER_AUTH_URL`: URL HTTPS canônica do sistema.
- `APP_ENV=production`, `LOG_LEVEL` e `APP_TIMEZONE=America/Sao_Paulo`.

Antes de iniciar a aplicação na VPS, executar `npm ci`, `npm run build` e
`npx prisma migrate deploy`. Backup/restore, rotação de segredos, observabilidade
e rollback devem ser definidos na etapa FP-014; não se deve copiar o `.env`
local nem publicar a porta do PostgreSQL na internet.
