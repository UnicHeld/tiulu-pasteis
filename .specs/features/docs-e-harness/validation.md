# Validação

## Resultados locais

Data: 2026-10-27. Ambiente: Node.js 22 em contêiner Alpine, PostgreSQL 17 isolado e Python 3.

| Comando                                                               | Resultado                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `docker compose -f compose.validation.yaml build quality integration` | imagens construídas                                            |
| `docker compose -f compose.validation.yaml run --rm quality`          | formatação, lint, tipos, testes, build, docs e hooks aprovados |
| `docker compose -f compose.validation.yaml run --rm integration`      | migração e 28 testes aprovados, incluindo nove PostgreSQL      |
| `docker compose -f compose.validation.yaml run --rm harness`          | L4, 100/108 pontos (93%), exit 0                               |
| `python3 scripts/check-docs.py --base HEAD`                           | links, configuração, skills e ADRs aprovados                   |
| `python3 -m unittest discover -s tests/harness -p 'test_*.py'`        | sete testes aprovados                                          |
| Validador `quick_validate.py` nas cinco skills                        | todas válidas                                                  |
| `git diff --check`                                                    | sem erros                                                      |
| Revisão de conteúdo e padrões comuns de segredo                       | sem ocorrências                                                |

A execução de quality passa 19 testes de domínio/HTTP e pula os nove testes PostgreSQL;
esses nove foram executados e passaram na execução separada de integration.

## Ocorrências de ambiente

- Host sem Node.js/npm: validações executadas em Docker.
- Build inicialmente bloqueado ao atualizar cache do Docker fora da área gravável; repetido
  com permissão adequada e concluído.
- Primeira formatação não conseguiu gravar arquivos por diferença de permissões; repetida com
  usuário padrão do contêiner e concluída.
- Instalação informou que ESLint 9 está fora de suporte; dependências foram preservadas dentro
  do escopo. `npm ci` reportou zero vulnerabilidades na construção da imagem.

## Limites

- O gate estrutural aponta ausência de pre-commit, licença e configuração MCP. Nenhum desses
  itens impede L4; não foram adicionados sem necessidade do projeto.
- ADR-0001 permanece proposto, sem alegação de aprovação formal.
- Não foram executados navegador, aparelhos reais, OAuth ou pagamento externo.
- O primeiro CI remoto concluiu qualidade/harness e integração com sucesso. O aviso de runtime
  descontinuado das actions motivou atualização para versões oficiais verificadas; o head final
  é conferido separadamente na entrega.
