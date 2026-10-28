# Visão geral das avaliações

| Camada         | Comando                                                        | O que verifica                                      |
| -------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Formatação     | `npm run format:check`                                         | consistência com Prettier                           |
| Lint           | `npm run lint`                                                 | regras ESLint de TypeScript                         |
| Tipos          | `npm run typecheck`                                            | cliente, servidor e testes                          |
| Domínio e HTTP | `npm test`                                                     | preços, estoque, horários, estados, origem e acesso |
| PostgreSQL     | `RUN_DB_TESTS=1 npm test`                                      | fluxo de pedidos contra banco isolado migrado       |
| Build          | `npm run build`                                                | bundle Vite e servidor compilado                    |
| Documentação   | `python3 scripts/check-docs.py`                                | links, índices, skills e estrutura de ADRs          |
| Hooks          | `python3 -m unittest discover -s tests/harness -p 'test_*.py'` | decisões de guarda e feedback                       |
| Harness        | `npx --yes harness-score@1.6.5 . --min-level 4`                | maturidade estrutural mínima L4                     |

`npm test` sem `RUN_DB_TESTS=1` pula a suíte PostgreSQL. Isso não equivale a validar integração.
Alternativa reproduzível: `docker compose -f compose.validation.yaml run --rm integration`.

## CI

`.github/workflows/ci.yml` executa checks sem segredos de produção, com permissão de leitura do
repositório. PRs usam `pull_request`, nunca `pull_request_target` para executar código proposto.
Qualidade e integração precisam concluir com sucesso. Falha não é ignorada; em execução é pendente.

Harness score mede presença e configuração, não cobertura funcional. Não adicionar arquivos
inúteis, conectores fictícios ou licenças sem decisão apenas para aumentar a pontuação.

## Lacunas conhecidas

Não há suíte de navegador, auditoria automatizada de acessibilidade, avaliação em aparelhos reais
ou teste de pagamento externo. Homologação e recuperação de backup estão no
[runbook](../operacao/implantacao.md). Testes de concorrência devem ser ampliados antes de alto volume.
