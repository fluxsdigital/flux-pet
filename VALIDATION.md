# Validação

Conversão para componentes validada em 2026-09-18.

- A tela `flux_pet_gest_o_acolhedora_e_inteligente` é publicada em `/` pelo
  App Router, sem HTML estático ou `iframe` em tempo de execução.
- Três páginas antigas/duplicadas foram removidas das rotas públicas.
- Os Material Symbols usam a fonte local
  `public/fonts/material-symbols-outlined.ttf`.
- Os três JPEGs atuais do Stitch estão armazenados em `public/stitch/assets`.
- A suíte Playwright valida desktop e mobile, ausência de `iframe`, seções
  principais, interação do FAQ, fontes locais e rotas removidas.
- `npm run lint`, `npm run typecheck`, `npm run build` e `npm run test:e2e`
  foram aprovados.

## Dashboard executivo — 2026-10-01

- `/sistema` ganhou shell autenticado com navegação desktop/mobile e dashboard
  executivo baseado em dados demonstrativos tipados.
- A validação Playwright cria um workspace descartável, autentica e verifica em
  1440 × 900 e 390 × 844 os KPIs, filtros, estado vazio e menu móvel.
- `npm run typecheck`, `npm run build`, testes unitários e 14 testes E2E foram
  aprovados. O lint dos arquivos novos foi aprovado.
- O lint global permanece bloqueado por uma ocorrência anterior em
  `components/pos-manager.tsx:29` (`react-hooks/set-state-in-effect`), fora do
  escopo desta entrega e sem alteração para evitar sobrescrever trabalho alheio.
