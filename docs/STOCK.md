# Estoque e custo

`StockMovement` é um ledger append-only: entradas são positivas, saídas são
negativas e cada lançamento guarda custo unitário, saldo posterior, ator,
horário, lote/validade opcionais e referência. `StockBalance` é a projeção
atual por produto/loja.

Entradas usam custo médio móvel:

```text
novo custo = (saldo anterior × custo anterior + entrada × custo da entrada)
             / novo saldo
```

Saídas preservam o custo médio vigente e nunca deixam o saldo negativo.
Movimentações e inventários executam em transação PostgreSQL `SERIALIZABLE`.
Inventário confirmado registra esperado, contado e um movimento compensatório;
ele não altera nem apaga lançamentos anteriores.

API:

- `GET|POST /api/stock` — saldos, histórico, entradas e ajustes;
- `GET|POST /api/stock/inventories` — contagens e confirmação atômica.

Retry concorrente que conflita retorna 409. Operações de PDV terão chave de
idempotência própria em FP-007, evitando baixa duplicada após retry de rede.
