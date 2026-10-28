# Registro de decisões arquiteturais

ADR registra uma decisão, contexto, opções e consequências; responde por que o sistema funciona
assim. [Índice](../decisoes/README.md) e [modelo](../decisoes/_modelo.md).

## Quando registrar

Criar ADR quando a mudança for difícil de reverter, definir padrão estrutural, escolher entre
alternativas com trade-offs, mudar fronteira entre camadas, adotar dependência estrutural/gate ou
contradizer decisão aceita. Bug local, texto e parâmetro reversível ficam na spec ou no PR.

| Artefato    | Pergunta                             | Local               |
| ----------- | ------------------------------------ | ------------------- |
| Spec/design | o que implementar e como validar     | `.specs/`           |
| ADR         | por que uma estratégia foi escolhida | `docs/decisoes/`    |
| Arquitetura | como funciona hoje                   | `docs/arquitetura/` |
| Iniciativa  | qual o status, plano e rollout       | `docs/iniciativas/` |
| Operação    | como executar e recuperar            | `docs/operacao/`    |

## Ciclo de vida e aprovação

`Proposto` pode virar `Aceito` ou `Rejeitado`; aceito pode virar `Deprecado` ou
`Supersedido por ADR-NNNN`. Quem mantém o projeto registra a aprovação humana com evidência
na conversa ou no PR. Nunca inventar aprovador, data ou aprovação. Agente escreve `Proposto`.

Corpo de ADR finalizado é imutável. Só Status e Links mudam. Decisão nova exige ADR novo que
supere o anterior, com atualização de ambos os links e do índice. Não remover registros.

## Escrever e verificar

1. Usar próximo número livre com quatro dígitos e título afirmativo em `kebab-case`.
2. Preencher data, status, decisores, aprovação e escopo, sem inventar informação ausente.
3. Apresentar pelo menos duas opções reais e consequências positivas e negativas.
4. Escrever regras para quem implementa, verificáveis no diff.
5. Atualizar índice com título, status, escopo e paths regidos.
6. Executar `python3 scripts/check-docs.py` e revisar histórico/imutabilidade conforme `REVIEW.md`.

O check automatiza estrutura e links. Com `--base <commit>`, também bloqueia remoção de ADR
histórico e alteração do corpo de ADR finalizado; o CI informa a base do evento.
Aprovação e conformidade semântica exigem revisão humana.
O workflow `nova-adr` aplica este processo sem dependência de serviços externos.
