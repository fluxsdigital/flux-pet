# Arquitetura do Flux Pet

## Organização

- `app/page.tsx` e `components/`: landing pública preservada.
- `app/sistema/`: entrada da aplicação; receberá o shell autenticado em FP-004.
- `app/api/`: Route Handlers HTTP; `/api/health` verifica processo e banco.
- `lib/config/`: contrato tipado de variáveis de servidor.
- `lib/db.ts`: instância única do Prisma em desenvolvimento.
- `lib/logger.ts`: logger JSON com redaction de credenciais/cookies.
- `prisma/`: schema e migrations PostgreSQL.
- `tests/unit`, `tests/integration`, `tests/*.spec.ts`: pirâmide de testes.

## Dependências estruturais

- Next.js/React/TypeScript permanecem a base web.
- PostgreSQL 17 é a fonte de verdade.
- Prisma ORM 6.12 foi escolhido por estabilidade e auditoria npm limpa. A versão
  7.10 disponível apresentou advisory alto transitivo no CLI durante a
  implementação; a atualização fica condicionada a uma versão sem o advisory.
- Zod valida configuração e, nas próximas tarefas, entradas de casos de uso.
- Pino emite logs estruturados e remove campos sensíveis conhecidos.
- Vitest cobre domínio e integração; Playwright cobre fluxos reais.

## Ambientes

- Local: PostgreSQL em `127.0.0.1:5434` pelo `compose.yaml`.
- Teste: banco PostgreSQL real; testes de integração nunca usam mock de SQL.
- Preview/produção: exigirão `DATABASE_URL` PostgreSQL autorizado. A landing
  continua compilável/publicável sem conectar ao banco; `/api/health` responde
  `503` se o banco não estiver configurado ou acessível.

Segredos ficam em `.env` ignorado. `.env.example` contém somente credenciais de
desenvolvimento descartáveis.

## Convenções de persistência

- IDs CUID gerados no servidor.
- `organizationId` obrigatório em registros de domínio e `storeId` quando o
  dado pertence a uma loja.
- Relações críticas usam `Restrict`; exclusão em cascata não pode apagar
  histórico operacional.
- `AuditEvent` é append-only e indexado por organização/data e entidade.
- Instantes são UTC; o timezone padrão da organização/loja é
  `America/Sao_Paulo`.
- Migrations são versionadas e produção usa `prisma migrate deploy`.

## Comandos de qualidade

```bash
cp .env.example .env
npm run db:up
npm run db:migrate
npm run test:unit
npm run test:integration
npm run test:e2e
npm run lint
npm run typecheck
npm run build
```
