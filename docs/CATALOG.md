# Cadastros do MVP

Os endpoints `/api/catalog/:resource` e `/api/catalog/:resource/:id` atendem
`categories`, `products`, `suppliers`, `customers` e `services`. Organização e
lojas autorizadas são sempre derivadas da sessão; IDs externos não alteram o
escopo.

Listagens aceitam `q`, `storeId`, `status`, `page` e `pageSize` (máximo 100).
Cadastros usados pela operação não são removidos: `PATCH` altera o status para
`INACTIVE` e toda mutação gera `AuditEvent`.

Produtos usam valores `Decimal(14,2)`, SKU e código de barras únicos por loja.
`taxNotes` é apenas um campo preparatório; não há cálculo tributário no MVP.

Importação em lote fica para uma etapa futura. O contrato previsto é CSV com
pré-validação, resumo de erros por linha e confirmação idempotente; ele deverá
usar os mesmos schemas e regras de escopo dos endpoints atuais.
