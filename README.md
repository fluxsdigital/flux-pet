# Flux Pet

Landing page do **Flux Pet**, plataforma de gestão para pet shops. A interface
original do Google Stitch (projeto `7808829562387346976`) foi convertida para
componentes React reutilizáveis, preservando conteúdo, identidade visual,
responsividade e interações.

## Executar e validar

Requer Node.js 20 ou superior.

```bash
npm install
npm run db:up
npm run db:migrate
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
```

Copie `.env.example` para `.env` antes dos comandos de banco. O PostgreSQL
local é publicado somente em `127.0.0.1:5434`.

## Conteúdo publicado

- `/`: landing completa renderizada pelo App Router do Next.js.
- As seções de apresentação, produto, dashboard, estoque, conversão e FAQ são
  componentes React/TypeScript em `components/`.
- Os três assets visuais exportados permanecem locais em `public/stitch/assets`.
- Material Symbols e Plus Jakarta Sans são carregadas de arquivos locais; os
  nomes das ligaturas não ficam visíveis quando fontes externas falham.
- O FAQ é interativo, navegável por teclado e expõe seu estado com
  `aria-expanded`.

As rotas antigas `/acolhedora`, `/gestao-inteligente` e
`/gestao-inteligente-copia` foram removidas após a ressincronização.

## Fundação do sistema

- `/sistema`: shell autenticado e dashboard executivo responsivo com dados
  demonstrativos (financeiro, ponto de equilíbrio, estoque e recomendações).
- `/demonstracao`: prévia pública, isolada e somente leitura do dashboard, PDV,
  estoque e cadastros; não consulta banco nem substitui a autenticação normal.
- `/sistema/pdv`, `/sistema/estoque` e `/sistema/cadastros`: módulos operacionais
  preservados e acessíveis pela navegação lateral.
- `/api/health`: saúde do processo e conexão PostgreSQL.
- `prisma/`: schema e migrations versionadas.
- [`TODO.md`](TODO.md): sequência de entregas e critérios de aceite.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): decisões e operação local.
- [`docs/MVP.md`](docs/MVP.md): regras e fórmulas do MVP.

Os indicadores atuais do dashboard são mocks tipados em
`lib/dashboard-mock.ts`, explicitamente identificados na interface. A troca por
API poderá manter o contrato de apresentação sem acoplar cálculos ao componente.
