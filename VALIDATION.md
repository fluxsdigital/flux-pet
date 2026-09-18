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
