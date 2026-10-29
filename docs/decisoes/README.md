# Decisões arquiteturais

[Processo](../processos/registro-de-decisoes.md) e [modelo](./_modelo.md).
Somente ADRs `Aceito` vinculam implementação. Registros propostos ainda precisam de aprovação.

| ADR                                                          | Decisão                                                  | Status   | Escopo                             | Paths regidos                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [0001](./0001-harness-com-gate-de-maturidade.md)             | Manter harness versionado com gate de maturidade L4      | Proposto | plataforma                         | `AGENTS.md`, `REVIEW.md`, `.claude/`, `.codex/`, `.agents/`, `.cursor/`, `.github/workflows/`, `scripts/`, `docs/` |
| [0002](./0002-reservar-estoque-na-confirmacao-presencial.md) | Reservar estoque na confirmação presencial               | Proposto | domínio, servidor, dados e cliente | `src/domain/orders.ts`, `src/server/`, `src/client/`, `db/`, `tests/`                                              |
| [0003](./0003-pedidos-para-retirada-no-campus.md)            | Reservar pedidos para retirada no envio dentro do campus | Proposto | domínio, servidor, dados e cliente | `src/domain/`, `src/server/`, `src/client/`, `db/`, `tests/`                                                       |
