# Validação

Ressincronização realizada em 2026-09-17.

- O Stitch informa 4 registros de tela, mas disponibiliza HTML somente para
  `flux_pet_gest_o_acolhedora_e_inteligente`; essa é a página publicada em `/`.
- Três páginas antigas/duplicadas foram removidas das rotas públicas.
- Os 39 elementos Material Symbols usam a fonte local
  `public/fonts/material-symbols-outlined.ttf`, inclusive dentro do iframe.
- Os três JPEGs atuais do Stitch estão armazenados em `public/stitch/assets`.
- `npm run lint` e `npm run build` foram aprovados.
