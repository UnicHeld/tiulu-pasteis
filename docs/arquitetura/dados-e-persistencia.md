# Dados e persistência

| Tabela         | Responsabilidade                                                       |
| -------------- | ---------------------------------------------------------------------- |
| `users`        | identidade Google, nome e e-mail                                       |
| `sessions`     | hash de credencial, usuário opcional, permissão e expiração            |
| `products`     | catálogo, preço, preço promocional, disponibilidade e estoque          |
| `orders`       | comprador, hash de acompanhamento, retirada, total, pagamento e estado |
| `order_items`  | itens com nome, quantidade e preço preservados                         |
| `order_events` | histórico de estados                                                   |

`src/server/migrate.ts` aplica `db/001_initial.sql` em transação com advisory lock. A inicial é
idempotente; alterações posteriores precisam de estratégia de migração incremental. Não remover
dados ou modificar schema de produção como validação local.

Pedidos usam locks de produto e transações. Estoque nunca pode ficar negativo. Cancelamento,
reposição e evento são atômicos. Fidelidade é derivada de pedidos pagos e entregues, sem saldo
mutável ou crédito duplicado.

Sessões expiram em sete dias. A retirada de permissão de um gestor não invalida sessões já
emitidas: é preciso revogá-las no banco. Limpeza e retenção devem ter política operacional.
Definir retenção de nomes, e-mails, observações e histórico antes da operação comercial.

Backup e recuperação: [implantação](../operacao/implantacao.md).
