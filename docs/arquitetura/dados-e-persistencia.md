# Dados e persistência

| Tabela         | Responsabilidade                                                       |
| -------------- | ---------------------------------------------------------------------- |
| `users`        | identidade Google, nome e e-mail                                       |
| `sessions`     | hash de credencial, usuário opcional, permissão e expiração            |
| `products`     | catálogo, preço, preço promocional, disponibilidade e estoque          |
| `orders`       | comprador, hash de acompanhamento, retirada, total, pagamento e estado |
| `order_items`  | itens com nome, quantidade e preço preservados                         |
| `order_events` | histórico de estados                                                   |

`src/server/migrate.ts` aplica arquivos SQL numerados de `db/` em ordem, em transação com
advisory lock, registrando cada aplicação em `schema_migrations`. Bancos antigos executam a
inicial idempotente antes das incrementais. `002_counter_orders.sql` preserva pedidos/itens e
reservas legados; arquiva o catálogo de exemplo e inclui o novo com estoque zero. Reaplicação
não reseta estoque. `003_pickup_descriptions.sql` corrige somente as descrições do catálogo,
sem reescrever migrações anteriores ou alterar estoque e pedidos históricos. A tabela `orders` registra `stock_reserved`, `confirmed_at`, `expires_at`
e `pickup_accepted_at`. Não remover
dados ou modificar schema de produção como validação local.

Pedidos usam locks de produto e transações. Estoque nunca pode ficar negativo. Criação do pedido, reserva imediata,
itens e evento são atômicos. Novos pedidos usam `received`, `confirmed_at` na criação e
`expires_at=null`. Cancelamento de pedido recebido, reposição e evento são atômicos.
Pré-pedidos legados em `awaiting_arrival` continuam sem reserva até confirmação presencial
de presença/pagamento, preservando sua expiração. Fidelidade é derivada de pedidos pagos e entregues, sem saldo
mutável ou crédito duplicado.

Sessões expiram em sete dias. A retirada de permissão de um gestor não invalida sessões já
emitidas: é preciso revogá-las no banco. Limpeza e retenção devem ter política operacional.
Definir retenção de nomes, e-mails, observações e histórico antes da operação comercial.

Backup e recuperação: [implantação](../operacao/implantacao.md).

A localização enviada é validada sem persistência, inclusive sem armazenamento em eventos ou logs.

## Catálogo e preço preservado

`004_catalog_categories.sql` separa Pastéis de Salgados. `005_catalog_and_combos.sql` inclui
queijo com goiabada, salgados e mini pizzas com estoque zero. Metadados `combo_size`,
`combo_drink` e `customizable` governam elegibilidade e personalização; nomes não concedem desconto.
`orders.discount_total` preserva o desconto de combo (zero nos legados). `order_items.ingredients`
é um array JSON com os nomes dos ingredientes escolhidos, validado antes da transação.
Preços unitários são avulsos: `orders.total = soma(unit_price × quantity) - discount_total`.
Uma linha por produto preserva a chave e a reposição de estoque. Alterar preço do catálogo
não altera snapshots ou totais históricos. Não se recalcula desconto ao confirmar um legado.
