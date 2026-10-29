# ADR-0002: Reservar estoque na confirmação presencial

- **Data**: 2026-10-28
- **Status**: Proposto
- **Decisores**: Responsável pelo estabelecimento
- **Aprovação**: Pendente
- **Escopo**: domínio, servidor, dados e cliente

## Contexto e problema

O estabelecimento quer fritar na chegada e evitar produção ou reserva por pedidos abandonados.
O fluxo anterior reservava estoque ao registrar pedido, inclusive anônimo e agendado.

## Drivers da decisão

- Preservar estoque e pedidos históricos, sem preparar antes da presença.
- Manter autorização e decisões de estoque na API com confirmação atômica.

## Opções consideradas

1. **Reservar no registro**: garante disponibilidade, mas prende estoque de ausentes.
2. **Reservar no balcão**: preserva capacidade real; exige avisar que o pré-pedido não garante itens.

## Decisão

Implementar pré-pedido autenticado sem reserva, com expiração, e confirmação presencial
transacional. QR contém somente identificador e exige autorização para consultar detalhes.
Migrações passam a ser numeradas e registradas para não repetir alterações de catálogo.

## Consequências

### Positivas

- Ausência não gera preparo ou baixa de estoque. Histórico e reservas legados são preservados.
- Leitura de QR não concede acesso nem inicia operações financeiras ou de cozinha.

### Negativas

- Disponibilidade pode mudar antes da chegada; operação precisa comunicar e conferir itens.
- Pagamento online antecipado depende de política de reserva, expiração e reembolso.
- Leitura por câmera usa `@zxing/browser`, carregado sob demanda, e exige HTTPS/permissão.

## Regras para quem implementa

- Reservar produtos em ordem de ID, com pagamento e evento na mesma transação de confirmação.
- Não repor estoque em cancelamento/expiração sem reserva. Não cancelar alimento em preparo.
- Não incluir tokens ou dados pessoais no QR; detalhes exigem titular ou gestor na API.
- Migrações aplicadas constam em `schema_migrations`; não editar migrações já aplicadas.

## Links

- [ADR-0003: nova proposta de reserva no envio](0003-pedidos-para-retirada-no-campus.md);
  substitui esta proposta no fluxo atual, sem presumir aceite formal.

- [Fluxo de pedidos](../arquitetura/fluxo-de-pedidos.md).
- [Especificação](../../.specs/features/pedido-no-balcao/spec.md).
