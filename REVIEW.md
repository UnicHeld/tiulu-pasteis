# Checklist de code review

Método comum para revisão humana e automatizada. Regras técnicas continuam em `AGENTS.md`.

## Critério vigente

- **COMMENT** por padrão.
- **REQUEST CHANGES** para segurança, exposição de dados pessoais/credenciais, violação de
  autorização ou integridade de pedidos, pagamento e estoque.
- Nunca aprovar ou fazer merge automaticamente.

## O que conta como falha

| Critério                           | Exemplo                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| Credencial ou dado pessoal exposto | cookie, código OAuth ou código de acompanhamento em log            |
| Autorização delegada ao cliente    | aluno alterando pedido por ID sem conferir sessão                  |
| Regra de negócio incorreta         | total recebido do navegador; entrega sem pagamento                 |
| Perda de atomicidade               | estoque baixado sem pedido ou cancelamento sem reposição           |
| Mudança sem teste relevante        | regra de transição alterada sem cenário que discrimine a regressão |
| Contrato/documentação incompatível | endpoint ou variável alterado sem atualizar sua fonte              |
| ADR aceito contornado              | mudança contra regra vigente sem ADR que a supere                  |
| Segurança de CI reduzida           | segredo em PR de fork, permissão excessiva ou lockfile omitido     |

Estilo coberto por lint, preferência pessoal e código preexistente não são defeitos novos.
Marcar achados anteriores como `[pré-existente]`.

## Paths sensíveis

| Área                          | Paths                                             | Conferir                                      |
| ----------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Autenticação e dados pessoais | `src/server/app.ts`, `src/server/db.ts`           | sessão, origem, ownership e logs              |
| Pedidos e estoque             | `src/domain/`, `src/server/app.ts`, `db/`         | total, concorrência, transações e estados     |
| PWA                           | `public/sw.js`                                    | cache, dados pessoais e duplicação de pedidos |
| Dependências e CI             | `package*.json`, `.github/workflows/`, `scripts/` | execução não confiável e privilégios          |
| Harness                       | `.claude/`, `.codex/`, `.agents/`, `.cursor/`     | hooks, comandos, fontes e autorização         |
| Decisões                      | `docs/decisoes/` e paths do índice                | regras vigentes e histórico imutável          |

Ignorar gerados (`node_modules/`, `dist/`, `dist-server/`, `coverage/`) e revisar destinos/links de
arquivos movidos. Fixtures versionadas fazem parte da revisão.

## Evidência e CI

Cada achado exige cenário de falha concreto e `arquivo:linha`, com teste ou trecho quando útil.
Conferir o head atual antes de falar do CI. Em fila ou em execução significa **pendente**;
sucesso exige conclusão dos checks; falha cita o check e seu erro.

## Classificação de risco

| Tier  | Quando                                            | Profundidade                       |
| ----- | ------------------------------------------------- | ---------------------------------- |
| Baixo | documentação e texto                              | diff, fatos e links                |
| Médio | comportamento localizado e testes                 | diff e consumidores imediatos      |
| Alto  | paths sensíveis, schema, dependências, CI e hooks | diff, vizinhos e cenários de falha |

O risco depende da mudança. Declarar o motivo pelos paths e contratos afetados.

## Template de resumo

```text
Risco: <Baixo|Médio|Alto> — <motivo>

<N> substantivos, <M> nits, <B> bloqueantes
<uma a três linhas com comportamento e conclusão>
```

Ordenar achados por severidade, com problema, impacto, evidência e menor correção viável.
Sem achados: `0 substantivos, 0 nits, 0 bloqueantes — nada a corrigir.`
Relatar validações executadas, omitidas e riscos residuais mesmo sem achados.

## Segunda passada obrigatória

Antes de publicar cada achado: confirmar cenário, linha exata e se foi introduzido pela mudança.
Sem evidência suficiente, registrar dúvida ou remover o achado. Máximo de três nits por revisão.

## Recorrência 3x

Problema da mesma classe em três revisões distintas vira proposta de automação (lint, teste ou
regra), com links para as ocorrências. Não criar PR nem fazer merge sem autorização. Se recusada,
registrar o motivo e recontar somente ocorrências novas.
